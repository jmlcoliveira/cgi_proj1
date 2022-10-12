precision highp float;

const float FIELD_OPACITY_MULTIPLIER = 0.00001;
const float LINE_INTERVAL = 0.6;
const int MAX_PLANETS = 10;
const float pi = 3.14159265359;
const float g = 00000000000.667;
const float p = 5510.0;
const float Rc = 6371000.0;
const float m1 = 1.0;

uniform vec2 uPlanetsPos[MAX_PLANETS];
uniform float uPlanetsR[MAX_PLANETS];
uniform float uCurrentPlanets;

varying vec2 fPosition;

vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    vec2 finalForce = vec2(0.0, 0.0);
    highp int index = int(uCurrentPlanets);
    bool temp = false;

    for(int i=0; i<MAX_PLANETS; i++) {
        if(i >= index) break;

        float dist = sqrt(pow(uPlanetsPos[i].x - fPosition.x, 2.0) + pow(uPlanetsPos[i].y - fPosition.y, 2.0));
        if(dist < 0.005) {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
            return;
        }

        float m2 = (4.0 * pi * pow(uPlanetsR[i], 3.0) * p) / 3.0;
        float force = (g * m1 * m2) / pow(dist, 2.0);
        float angle = atan(uPlanetsPos[i].y - fPosition.y, uPlanetsPos[i].x - fPosition.x);
        vec2 currentForce = vec2(force*cos(angle), force*sin(angle));
        finalForce += currentForce;
    }

    float finalAngle = atan(finalForce.y, finalForce.x);
    float finalForceIntensity = finalForce.x*cos(finalAngle) + finalForce.y*sin(finalAngle);
    
    if(mod(log(finalForceIntensity), LINE_INTERVAL) >= 0.0 && mod(log(finalForceIntensity), LINE_INTERVAL) <= 0.08) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    } else
        gl_FragColor = vec4(hsv2rgb(vec3(finalAngle/(2.0*pi), 1.0, 1.0)), mix(0.0, 1.0, abs(finalForceIntensity)*FIELD_OPACITY_MULTIPLIER));
}
