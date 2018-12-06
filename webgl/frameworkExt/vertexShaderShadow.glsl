uniform mat4 modelViewProjectionMatrix;
attribute vec3 position;
varying vec4 vProjCoord;

void main() {
    vProjCoord  = modelViewProjectionMatrix * vec4(position, 1.0);
    gl_Position = vProjCoord;
}
