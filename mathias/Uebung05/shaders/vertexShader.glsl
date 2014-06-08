attribute vec3 position;
attribute vec3 normal;
attribute vec2 texcoord;
attribute vec4 color;

uniform mat4 modelViewProjectionMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 normalMatrix;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec4 vColor;
varying vec2 vTexcoord;

void main() {
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    vNormal   = (normalMatrix    * vec4(normal,   0.0)).xyz;
    vColor    = color;
    vTexcoord = texcoord;

    gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);
}
