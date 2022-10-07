precision mediump float;

/* Number of seconds (possibly fractional) that has passed since the last
   update step. */
uniform float uDeltaTime;

/* Inputs. These reflect the state of a single particle before the update. */
const float pi = 3.14159265359;

uniform vec2 spawnPosition;
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

// generates a pseudo random number that is a function of the argument. The argument needs to be constantly changing from call to call to generate different results
highp float rand(vec2 co)
{
    highp float a = 12.9898;
    highp float b = 78.233;
    highp float c = 43758.5453;
    highp float dt= dot(co.xy ,vec2(a,b));
    highp float sn= mod(dt,3.14);
    return fract(sin(sn) * c);
}

/*vec2 calcCircleSpawnPos(vec2 center, float radius) 
{
     float ang = uRand * pi * 2.0;
     float r = radius * sqrt(rand(vec2(uDeltaTime,uDeltaTime)));
     return vec2(center.x + r*cos(ang), center.y + r*sin(ang));
}*/


void main() {

   /* Update parameters according to our simple rules.*/
   vPositionOut = vPosition + vVelocity * uDeltaTime;
   vAgeOut = vAge + uDeltaTime;
   vLifeOut = vLife;

   vec2 accel = vec2(0.0);
   vVelocityOut = vVelocity + accel * uDeltaTime;
      
   if (vAgeOut >= vLife) {
      vPositionOut = spawnPosition;
      vLifeOut = /*randomNumBetween(uMinLife, uMaxLife);*/rand(vec2(uDeltaTime, vLife)) * (uMaxLife-uMinLife) + uMinLife;
      vAgeOut = 0.0;

      float angle = atan(vVelocity.x, vVelocity.y);
      float vel = rand(vec2(uDeltaTime, vVelocity)) * (uMaxVelocity-uMinVelocity) + uMinVelocity;
      vVelocityOut.x = 0.5*vel*cos(angle);//rand(vec2(uDeltaTime, vVelocity.x)) * (uMaxVelocity - uMinVelocity) + uMinVelocity;
      vVelocityOut.y = vel*sin(angle);
   }
}