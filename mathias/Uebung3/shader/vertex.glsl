attribute vec3 position;
attribute vec2 texCoord;
attribute vec3 color;

uniform mat4 transMat; 
varying vec3 vColor;
varying vec2 vTexCoord;

void main() {
	vColor = color;
	vTexCoord = texCoord;
	

	
	
	vec4 pos = transMat * vec4(position, 1.0);
	gl_Position = pos;
}

