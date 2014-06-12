#ifdef GL_FRAGMENT_PRECISION_HIGH
	precision highp float;
#else
	precision mediump float;
#endif;

// Texturen fuer Farbwert
uniform sampler2D tex0;         // Textur 1
uniform float tex0Loaded;       // Textur vorhanden?
uniform float vertexColors;     // Vertex-Color

// Materialeigenschaften fuer Beleuchtung
uniform vec3 diffuseColor;      // Diffuse Farbe
uniform vec3 specularColor;     // Specular Farbe
uniform vec3 lightDirection;    // Lichtrichtung direktionaler Lichtquelle

// Uebergebene Werte vom Vertex-Shader
varying vec3 vPosition;         // Berechnete Position des Vertex aus dem Vertex-Shader
varying vec3 vNormal;           // Berechnete Normale des Vertex aus dem Vertex-Shader
varying vec4 vColor;            // Berechnete Farbe des Vertex aus dem Vertex-Shader
varying vec2 vTexcoord;         // Berechnete Textur-Koordinate des Vertex aus dem Vertex-Shader


void main() {
    vec3 color;                                 // Zwischenwert der Farbe waehrend Berrechnung
    vec4 finalCol = vec4(0.0, 0.0, 0.0, 1.0);   // Finaler Farbwert fuer abschliessende Zuweisung an gl_FragColor

    vec3 lightColor = vec3(0.3, 0.3, 0.2);      // Definierte Lichtfarbe
    vec3 ambient = vec3(0.05);                  // Definierter ambienter Wert
    float shininess = 128.0;                    // Breite der spekularen Reflektion

    vec3 normal  = normalize(vNormal);          // Vertex-Normale normalisiert
    vec3 light   = normalize(-lightDirection);  // umgekehrte Lichtrichtung normalisiert
    vec3 view    = normalize(-vPosition);       // umgekehrte Blickrichtung normalisiert
    vec3 halfVec = normalize(light + view);     // Halbvektor normalisiert


    if (tex0Loaded == 1.0)                      // Falls eine Textur uebergeben?
    {
        color = texture2D(tex0, vTexcoord).rgb; // ggf. Farbwert aus der Textur uebernehmen
    }
    else if (vertexColors == 1.0)               // Sonst, falls Vertex-Color gegeben?
    {
        color = vColor.rgb;                     // ggf. Vertex-Color uebernehmen
    }
    else                                        // Falls keine Textur und keine Vertex-Colors definiert
    {
        color = diffuseColor;                   // Standard Diffuse-Farbe uebernehmen
    }


    // ----- Lichtquellen -------

    // Verfolgerlicht mit Richtung gleich der Blickrichtung => light == view == halfVec
    float NdotL = max(dot(normal, view), 0.0);              // Winkel zwischen Fragment-Normale und Licht-/Blickrichtung
    // Phong aus ambient + diffuse + specular
    finalCol.rgb += ambient;                                // Ambienter Anteil
    finalCol.rgb += NdotL * color;                          // Diffuser Anteil
    finalCol.rgb += pow(NdotL, shininess) * specularColor;  // Spekularer Anteil


    // Direktionale Lichtquelle mit einberrechnen
    NdotL = max(dot(normal, light), 0.0);                   // Winkel zwischen Fragment-Normale und Richtung der Lichtquelle
    // Phong aus ambient + diffuse + specular
    vec3 diffuse = color * NdotL * lightColor;
    float powNdotH = pow(max(dot(normal, halfVec), 0.0), shininess);
    vec3 specular = specularColor * powNdotH * lightColor;

    finalCol.rgb += ambient + diffuse + specular;

    gl_FragColor = finalCol;                                // Errechneter finaler Farbwert fuer Fragment uebergeben
}
