// Gouraud-Shader

// Version 1.0

attribute vec3 position;
attribute vec3 normal;
attribute vec2 texcoord;

uniform mat4 modelView;
uniform mat4 projectionMatrix;
uniform mat4 modelViewInvT;

uniform vec3 lightDirection;        // Lichtrichtung direktionaler Lichtquelle
uniform vec3 uDirectionalColor;
uniform vec3 materialDiffuseColor;
uniform vec3 materialAmbientColor;

// Werte fuer den Fragment-Shder
varying vec3 vColor;



void main(void) {

    vec3 ambient = vec3(0.05);                  // Definierter ambienter Wert

    vec3 transformedNormal = vec3(modelViewInvT * vec4(normal,1.0));
    vec3 normal = normalize(transformedNormal);
    vec3 unitLightDirection = normalize(lightDirection);
    float lambertTerm = max(dot(normal, -unitLightDirection), 0.0);
    //
    vColor = uAmbientColor * materialAmbientColor + materialDiffuseColor * uDirectionalColor * lambertTerm;
    //
    gl_Position = projectionMatrix * modelView * vec4(position, 1.0);
}