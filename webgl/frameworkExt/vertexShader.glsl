attribute vec3 position;
attribute vec3 normal;
attribute vec2 texcoord;
attribute vec4 color;

uniform mat4 modelViewProjectionMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 normalMatrix;

uniform float curShadowUnit;
uniform mat4 MVP_light;
// point light
uniform vec3 pntLightPosition;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec4 vColor;
varying vec2 vTexcoord;

varying vec3 vlightVec;   // light
varying vec4 vProjCoord;  // shadow

void main() {
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;    // point
    vNormal   = (normalMatrix    * vec4(normal,   0.0)).xyz;    // vector
    vColor    = color;
    vTexcoord = texcoord;
    vlightVec = pntLightPosition - vPosition;   // normalize after interpolation

    if (curShadowUnit >= 0.0) {
        vProjCoord = MVP_light * vec4(position + 0.005 * normal, 1.0);
    }
    gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);
}
