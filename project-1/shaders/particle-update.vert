precision mediump float;

/* Number of seconds (possibly fractional) that has passed since the last
   update step. */
uniform float uDeltaTime;

/* Inputs. These reflect the state of a single particle before the update. */
const int MAX_PLANETS = 10;
const float pi = 3.14159265359;
const float g = 0.0000000000667;
const float p = 5510.0;
const float Rc = 6371000.0;
const float m1 = 1.0;

uniform vec2 uScale;                   //X and Y scale

uniform vec2 uPlanetsPos[MAX_PLANETS];
uniform float uPlanetsR[MAX_PLANETS];
uniform float uPlanetsType[MAX_PLANETS]; //1.0 if attracts, -1.0 if repels
uniform float uCurrentPlanets; 

uniform vec2 uSpawnPosition;
uniform float uMaxLife;
uniform float uMinLife;
uniform float uMaxVelocity;
uniform float uMinVelocity;
uniform float uVelocityAngle;
uniform float uFluxAngle;

attribute vec2 vPosition;              // actual position
attribute float vAge;                  // actual age (in seconds)
attribute float vLife;                 // when it is supposed to dye 
attribute vec2 vVelocity;              // actual speed

/* Outputs. These mirror the inputs. These values will be captured into our transform feedback buffer! */
varying vec2 vPositionOut;
varying float vAgeOut;
varying float vLifeOut;
varying vec2 vVelocityOut;

// generates a pseudo random number that is a function of the argument. 
//The argument needs to be constantly changing from call to call to generate different results
highp float rand(vec2 co)
{
    highp float a = 12.9898;
    highp float b = 78.233;
    highp float c = 43758.5453;
    highp float dt= dot(co.xy ,vec2(a,b));
    highp float sn= mod(dt,3.14);
    return fract(sin(sn) * c);
}

//chnage particle postion to the spawn postion, generate random life and velocity
void respawn(){
   vPositionOut = uSpawnPosition*uScale;
   vLifeOut = rand(vPosition) * (uMaxLife-uMinLife) + uMinLife;
   vAgeOut = 0.0;

   float angle = (2.0*rand( vVelocity * uDeltaTime) * uFluxAngle) - uFluxAngle;
   float vel = rand(vPosition* vVelocity * uDeltaTime) * (uMaxVelocity-uMinVelocity) + uMinVelocity;
   vVelocityOut.x = vel*cos(angle + uVelocityAngle);
   vVelocityOut.y = vel*sin(angle + uVelocityAngle);
}

//calculate acceleration created by the gravitic field(s) of the planet(s)
vec2 calcAccel(){
   vec2 finalForce = vec2(0.0, 0.0);
    highp int index = int(uCurrentPlanets);
    vec2 uPlanetsPosAux[MAX_PLANETS];

    for(int i=0; i<MAX_PLANETS; i++) {
      if(i >= index) break;
      uPlanetsPosAux[i] = uPlanetsPos[i]*uScale;

      float dist = distance(uPlanetsPosAux[i], vPosition) * Rc;
      float r = uPlanetsR[i]*Rc;
      if(dist < r)
         r = dist;

      float m2 = (4.0 * pi * pow(r, 3.0) * p) / 3.0;
      float force = (g * m1 * m2) / pow(dist, 2.0);
      float angle = atan(uPlanetsPosAux[i].y - vPosition.y, uPlanetsPosAux[i].x - vPosition.x);
      finalForce += vec2(force*cos(angle), force*sin(angle)) * uPlanetsType[i];
    }
      return finalForce/m1;
}

void main() {

   /* Update parameters according to our simple rules.*/
   vPositionOut = vPosition + vVelocity * uDeltaTime;
   vAgeOut = vAge + uDeltaTime;
   vLifeOut = vLife;

   vec2 accel = calcAccel();
   vVelocityOut = vVelocity + accel * uDeltaTime;
      
   if (vAgeOut > vLife) {
      respawn();
   }
}