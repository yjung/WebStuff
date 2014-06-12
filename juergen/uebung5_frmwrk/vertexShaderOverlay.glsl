attribute vec3 position;
varying vec2 vTexcoord;

void main() {
    vTexcoord = (position.xy + 1.0) / 2.0;
    gl_Position = vec4(position, 1.0);
}
