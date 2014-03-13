// texture
uniform sampler2D tex0;
// helpers to check if values are set
uniform float tex0Loaded;
uniform float vertexColors;
// some material properties for lighting
uniform vec3 diffuseColor;
uniform vec3 specularColor;
uniform vec3 lightDirection;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec4 vColor;
varying vec2 vTexcoord;

vec4 toonify(float value) {
    vec4 color = vec4(0.3, 0.3, 0.3, 1.0);

    if (abs(value) < 0.5)
        color.rgb = vec3(0.0);
    if (value > 0.8)
        color.rgb = vec3(0.5, 0.5, 0.5);

    return color;
}

void main() {
    vec3 color = diffuseColor;
    vec4 finalCol = vec4(0.0, 0.0, 0.0, 1.0);

    vec3 lightColor = vec3(0.3, 0.3, 0.2);
    vec3 ambient = vec3(0.05);
    float shininess = 128.0;

    vec3 normal  = normalize(vNormal);
    vec3 light   = normalize(-lightDirection);
    vec3 view    = normalize(-vPosition);
    vec3 halfVec = normalize(light + view);

  #if 1
    if (tex0Loaded == 1.0)
        color = texture2D(tex0, vTexcoord).rgb;
    else if (vertexColors == 1.0)
        color = vColor.rgb;
  #endif
  #if 0
    // procedural checkerboard pattern
    if (tex0Loaded == 1.0) {
        // ...but only if texCoords are given (assume there are if tex loaded)
        vec2 tc = floor(vTexcoord * 10.0);
        color *= vec3(mod(tc.s + tc.t, 2.0));
    }
  #endif
    //color = (lightDirection + 1.0) / 2.0;
    //color = (normal + 1.0) / 2.0;

    // headlight, light is at eye position
    // since l = v, half vector is viewing vector (or light vector respectively)
    float NdotL = max(dot(normal, view), 0.0);
    // very simple phong lighting with lightDir = viewDir and white light
    finalCol.rgb += ambient + NdotL * color + pow(NdotL, shininess) * specularColor;

  #if 1
    // then add contribution of directional light
    NdotL = max(dot(normal, light), 0.0);
    vec3 diffuse = color * NdotL * lightColor;

    float powNdotH = pow(max(dot(normal, halfVec), 0.0), shininess);
    vec3 specular = specularColor * powNdotH * lightColor;

    finalCol.rgb += ambient + diffuse + specular;
    //finalCol.rgb = color.rgb;
  #endif

    gl_FragColor = finalCol;
    //gl_FragColor = toonify(NdotL);//normal.z);
}
