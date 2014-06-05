#ifdef GL_FRAGMENT_PRECISION_HIGH
	precision highp float;
#else
	precision mediump float;
#endif;

uniform sampler2D tex;
uniform float texLoaded;

varying vec3 vColor;
varying vec2 vTexCoord;

void main() {
vec4 color = vec4(vColor, 1.0);

if (texLoaded == 1.0){
	color = texture2D(tex, vTexCoord);
}
	gl_FragColor = color;
}