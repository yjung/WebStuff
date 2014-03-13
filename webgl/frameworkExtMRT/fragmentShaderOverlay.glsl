uniform sampler2D tex0;
uniform sampler2D tex1;
uniform sampler2D tex2;

uniform float showOverlay;      // contains VFX mode
uniform float showShadowMap;
uniform float curShadowUnit;
uniform float cycle;

varying vec2 vTexcoord;


#define PI 3.14159265

const float width  = 800.0; //texture width
const float height = 600.0; //texture height

vec2 texel = vec2(1.0/ width, 1.0/ height);
const float numTexels = 1.5;

const vec3 colorSpace = vec3(0.2125, 0.7154, 0.0721);

const float znear = 0.1;  //camera clipping start
const float zfar = 100.0; //camera clipping end

//http://www.cambridgeincolour.com/tutorials/depth-of-field.htm
//http://dl.dropboxusercontent.com/u/11542084/DoF_bokeh_2.4
const float CoC = 0.03;         // circle of confusion
const float focalDepth = 1.0;   // 0.5;  //focal distance value in meters
const float focalLength = 20.0; // 10.0; //focal length in mm
const float fstop = 8.0;        // 5.6;  //f-stop value


// Laplace operator
float edgeDetect(sampler2D tex, vec2 coords) {
    vec2 wh = texel * numTexels;
	float kernel[5];
	vec2 offset[5];

	offset[0] = vec2(  0.0,   0.0);
	offset[1] = vec2(  0.0,  wh.y);
	offset[2] = vec2(  0.0, -wh.y);
	offset[3] = vec2( wh.x,   0.0);
	offset[4] = vec2(-wh.x,   0.0);

	kernel[0] = -4.0;
	kernel[1] =  1.0;
	kernel[2] =  1.0;
	kernel[3] =  1.0;
	kernel[4] =  1.0;

	float sum = 0.0;

    for (int i=0; i<5; i++) {
		vec3 tmp = texture2D(tex, coords + offset[i]).rgb;
		sum += dot(colorSpace, tmp) * kernel[i];
	}

    return clamp(1.0 - sum, 0.0, 1.0);
}

vec3 blur(sampler2D tex, vec2 coords) {
	vec2 wh = texel * numTexels;
	float kernel[9];
	vec2 offset[9];

	offset[0] = vec2(-wh.x,-wh.y);
	offset[1] = vec2( 0.0, -wh.y);
	offset[2] = vec2( wh.x -wh.y);

	offset[3] = vec2(-wh.x,  0.0);
	offset[4] = vec2( 0.0,   0.0);
	offset[5] = vec2( wh.x,  0.0);

	offset[6] = vec2(-wh.x, wh.y);
	offset[7] = vec2( 0.0,  wh.y);
	offset[8] = vec2( wh.x, wh.y);

	kernel[0] = 1.0/16.0;   kernel[1] = 2.0/16.0;   kernel[2] = 1.0/16.0;
	kernel[3] = 2.0/16.0;   kernel[4] = 4.0/16.0;   kernel[5] = 2.0/16.0;
	kernel[6] = 1.0/16.0;   kernel[7] = 2.0/16.0;   kernel[8] = 1.0/16.0;

    vec3 tmp, result = vec3(0.0);

	for (int i=0; i<9; i++) {
		tmp = texture2D(tex, coords + offset[i]).rgb;
		result += tmp * kernel[i];
	}

	return result;
}

float linearize(float depth) {
	return -zfar * znear / (depth * (zfar - znear) - zfar);
}

vec3 colorize(vec2 coords, float blur) {
    float fringe = 0.7;    // chromatic aberration/fringing
    float gain = 1.3;      // highlight gain;
    float threshold = 0.5; // highlight threshold;

    vec2 off = texel * fringe * blur;
	vec3 col;

	col.r = texture2D(tex0, coords + vec2( 0.0,    1.0)*off).r;
	col.g = texture2D(tex0, coords + vec2(-0.866, -0.5)*off).g;
	col.b = texture2D(tex0, coords + vec2( 0.866, -0.5)*off).b;

	const vec3 lumcoeff = vec3(0.299, 0.587, 0.114);
	float lum = dot(col, lumcoeff);
	float thresh = max((lum-threshold)*gain, 0.0);

	return col + mix(vec3(0.0), col, thresh*blur);
}

//generating noise pattern for dithering
vec2 rand(vec2 coord) {
    float sw = fract(1.0 - coord.s * (width / 2.0));
    float th = fract(coord.t * (height / 2.0));
	float noiseX = (sw*0.25 + th*0.75) * 2.0 - 1.0;
	float noiseY = (sw*0.75 + th*0.25) * 2.0 - 1.0;

	return vec2(noiseX, noiseY);
}


void main() {
    vec4 color = vec4(1.0);
    vec2 tc = vTexcoord;

    // show shadow texture for (debug) visualization
    if (curShadowUnit >= 0.0 && showShadowMap == 1.0) {
        color.rgb = texture2D(tex1, tc).zzz;
    }
    else if (showOverlay == 1.0) {
        tc.x += sin(PI * (tc.x + tc.y + cycle) * 4.0) / 100.0;
        color = texture2D(tex0, tc);

        float luminance = dot(colorSpace, color.rgb);
        //luminance = (luminance > 0.5) ? 1.0 : 0.0;
        color = vec4(luminance, luminance, luminance, 1.0);
    }
    else if (showOverlay == 2.0) {
        float sum = edgeDetect(tex0, tc);
        color.rgb = vec3(sum);
        //color.rgb = mix(color.rgb, vec3(sum), 0.95);
    }
    else if (showOverlay == 3.0) {
        color.rgb = blur(tex0, tc);
    }
    else if (showOverlay == 4.0) {
        float depth = linearize(texture2D(tex2, tc.xy).x);

        // autofocus option
        //vec2 focus = vec2(0.5, 0.5);
        //float fDepth = linearize(texture2D(tex2, focus).x);
        float fDepth = 1.0;

        float f = focalLength;     //focal length in mm
        float d = fDepth * 1000.0; //focal plane in mm
        float o = depth * 1000.0;  //depth in mm

        float a = (o*f) / (o-f);
        float b = (d*f) / (d-f);
        float c = (d-f) / (d*fstop*CoC);

        float blur = abs(a - b) * c;
        blur = clamp(blur, 0.0, 1.0);

        // calculation of pattern for dithering
        vec2 noise = rand(tc) * blur * 0.0001;

        // getting blur x and y step factor
        vec2 wh = texel * blur + noise;

        const float bias = 0.5; // edge bias
        const int samples = 3; //samples on the first ring
        const int rings = 3;   //ring count
        const int cnt = samples * rings;

        // calculation of final color
        vec3 col = texture2D(tex0, tc).rgb;
        float s = 1.0;

        for (int i=1; i<=rings; i++) {
            int ringsamples = i * samples;
            float step = PI * 2.0 / float(ringsamples);
            float m = mix(1.0, float(i)/float(rings), bias);

            for (int j=0 ; j<cnt; j++) {
                float pw = cos(float(j)*step)*float(i);
                float ph = sin(float(j)*step)*float(i);

                col += colorize(tc + vec2(pw, ph)*wh, blur) * m;
                s += m;

                if (j == ringsamples)
                    break;
            }
        }

        color.rgb = col / s;    //divide by sample count
    }
    else {
        color = texture2D(tex0, tc);
    }

    gl_FragColor = color;
}
