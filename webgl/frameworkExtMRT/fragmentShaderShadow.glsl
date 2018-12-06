varying vec4 vProjCoord;

void main() {
    vec3 proj = (vProjCoord.xyz / vProjCoord.w + 1.0) / 2.0;
    gl_FragColor = vec4(proj, 1.0);
}
