#ifdef GL_EXT_draw_buffers
#extension GL_EXT_draw_buffers : require
#endif

// texture
uniform sampler2D tex0;
uniform sampler2D tex1;

// helpers to check if values are set
uniform float tex0Loaded;
uniform float curShadowUnit;  // -1 if unset
uniform float vertexColors;
uniform float showOverlay;    // >0 if true

// some material properties for lighting
uniform vec3 diffuseColor;
uniform vec3 specularColor;
uniform float alpha;
// light
uniform vec3 lightDirection;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec4 vColor;
varying vec2 vTexcoord;

varying vec3 vlightVec;
varying vec4 vProjCoord;  // shadows

const vec3 lightColor    = vec3(0.2, 0.2, 0.0);
const vec3 pntLightColor = vec3(0.4, 0.0, 0.0);
const vec3 ambient    = vec3(0.05);
const float shininess = 128.0;

void main() {
    vec4 color = vec4(diffuseColor, 1.0);
    vec4 finalCol = vec4(0.0, 0.0, 0.0, alpha);

    vec3 normal  = normalize(vNormal);
    vec3 light   = normalize(-lightDirection);
    vec3 view    = normalize(-vPosition);
    vec3 halfVec = normalize(light + view);

  #if 1
    if (tex0Loaded == 1.0 && curShadowUnit != 0.0)
        color = texture2D(tex0, vTexcoord);
    else if (vertexColors == 1.0)
        color = vColor;
  #endif
  #if 0
    // procedural checkerboard pattern
    if (tex0Loaded == 1.0) {
        // ...but only if texCoords are given (assume there are if tex loaded)
        vec2 tc = floor(vTexcoord * 10.0);
        color.rgb *= vec3(mod(tc.s + tc.t, 2.0));
    }
  #endif

    // headlight, light is at eye position
    // since l = v, half vector is viewing vector (or light vector respectively)
    float NdotL = max(dot(normal, view), 0.0);

    // very simple phong lighting with lightDir = viewDir and white light
    finalCol.rgb += ambient + NdotL * color.rgb + pow(NdotL, shininess) * specularColor;

  #if 1
    // then add contribution of directional light
    NdotL = max(dot(normal, light), 0.0);
    vec3 diffuse = color.rgb * NdotL * lightColor;

    float powNdotH = pow(max(dot(normal, halfVec), 0.0), shininess);
    vec3 specular = specularColor * powNdotH * lightColor;

    finalCol.rgb += ambient + diffuse + specular;

    // ...and also from point light
    light   = normalize(vlightVec);
    halfVec = normalize(light + view);

    NdotL = max(dot(normal, light), 0.0);
    diffuse = color.rgb * NdotL * pntLightColor;

    powNdotH = pow(max(dot(normal, halfVec), 0.0), shininess);
    specular = specularColor * powNdotH * pntLightColor;

    finalCol.rgb += ambient + diffuse + specular;
  #endif

    // alpha can come from various sources
    finalCol.a *= color.a;

    // if shadowed multiply with shadow intensity
    if (curShadowUnit >= 0.0) {
        vec3 proj = (vProjCoord.xyz / vProjCoord.w + 1.0) / 2.0;

        vec3 shadowCol = texture2D(tex1, proj.xy).xyz;

        if (proj.z > shadowCol.z)
            finalCol.rgb *= 0.6;    // shadow intensity
    }

#ifndef GL_EXT_draw_buffers
    //if (finalCol.a < 0.5) discard; else
    gl_FragColor = finalCol;

#else
    gl_FragData[0] = finalCol;

    if (showOverlay > 0.0) {
        gl_FragData[1] = vec4(gl_FragCoord.zzz, 1.0);
    }
#endif
}
