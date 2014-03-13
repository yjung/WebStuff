uniform sampler2D tex0;
uniform sampler2D tex1;

uniform float showShadowMap;
uniform float curShadowUnit;

uniform float cycle;

varying vec2 vTexcoord;

const vec3 colorSpace = vec3(0.2125, 0.7154, 0.0721);
const float numTexels = 1.5;

const vec2 offset0 = vec2(0.0, 0.0);
const vec2 offset1 = numTexels * vec2(0.0,  0.0016666667);  // next texel (1/600)
const vec2 offset2 = numTexels * vec2(0.0, -0.0016666667);
const vec2 offset3 = numTexels * vec2( 0.00125, 0.0);       // next texel (1/800)
const vec2 offset4 = numTexels * vec2(-0.00125, 0.0);

const float kernelValue0 = -4.0;
const float kernelValue1 = 1.0;
const float kernelValue2 = 1.0;
const float kernelValue3 = 1.0;
const float kernelValue4 = 1.0;

void main() {
    vec4 color = vec4(1.0);

#if 0
    vec2 tc = vTexcoord;
    //tc.x += sin(3.14159265 * (tc.x + tc.y + cycle) * 4.0) / 100.0;
    color = texture2D(tex0, tc);

    float luminance = dot(colorSpace, color.rgb);
    //luminance = (luminance > 0.5) ? 1.0 : 0.0;
    color = vec4(luminance, luminance, luminance, 1.0);

#else
    float sum = 0.0;
    vec3 tmp, colSum = vec3(0.0);

    tmp = texture2D(tex0, vTexcoord + offset0).rgb;
    color.rgb = tmp;
    colSum += tmp;
    sum += dot(colorSpace, tmp) * kernelValue0;

    tmp = texture2D(tex0, vTexcoord + offset1).rgb;
    colSum += tmp;
    sum += dot(colorSpace, tmp) * kernelValue1;

    tmp = texture2D(tex0, vTexcoord + offset2).rgb;
    colSum += tmp;
    sum += dot(colorSpace, tmp) * kernelValue2;

    tmp = texture2D(tex0, vTexcoord + offset3).rgb;
    colSum += tmp;
    sum += dot(colorSpace, tmp) * kernelValue3;

    tmp = texture2D(tex0, vTexcoord + offset4).rgb;
    colSum += tmp;
    sum += dot(colorSpace, tmp) * kernelValue4;

    sum = 1.0 - sum;
    //color.rgb = colSum / 5.0;  // blur
    color.rgb = mix(color.rgb, vec3(sum), 0.95);   // edges
#endif

    // show shadow texture for visualization
    if (curShadowUnit >= 0.0 && showShadowMap == 1.0)
        color.rgb = texture2D(tex1, vTexcoord).zzz;

    gl_FragColor = color;
}
