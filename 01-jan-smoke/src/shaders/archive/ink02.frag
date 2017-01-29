precision mediump float;

uniform float iGlobalTime;
uniform sampler2D lastTex;
uniform vec3 iResolution;
uniform sampler2D audioTex;

#pragma glslify: noise = require("glsl-noise/simplex/3d")
#pragma glslify: curlNoise = require("glsl-curl-noise/curl")

#define STEP 0.05

vec2 findGrad(vec2 uv, sampler2D tex) {
  float l = texture2D(tex, uv + vec2(-STEP, 0)).r;
  float r = texture2D(tex, uv + vec2( STEP, 0)).r;
  float u = texture2D(tex, uv + vec2(0, -STEP)).r;
  float d = texture2D(tex, uv + vec2(0,  STEP)).r;
  return vec2(r - l, u - d);
}

vec2 findGradNoise(vec2 uv, float t) {
  float l = noise(vec3(uv + vec2(-STEP, 0), t));
  float r = noise(vec3(uv + vec2( STEP, 0), t));
  float u = noise(vec3(uv + vec2(0, -STEP), t));
  float d = noise(vec3(uv + vec2(0,  STEP), t));
  return vec2(r - l, u - d);
}

void main() {
  float aspect = iResolution.y / iResolution.x;
  vec2 texCoord = gl_FragCoord.xy / iResolution.xy;
  vec2 uv0 = texCoord;
  uv0.y *= aspect;
  vec2 uv = texCoord - vec2(0.5);
  uv.y *= aspect;

  vec3 o = vec3(0.0);

  vec3 curl = curlNoise(vec3(texCoord, iGlobalTime / 10.0));
  curl /= 300.0;
  vec3 curled = texture2D(lastTex, texCoord + curl.xy).rgb;
  curled = smoothstep(vec3(0.05), vec3(0.1), curled) * curled * 0.95;

  float nSquaresX = floor(pow(iResolution.x, 1.0/2.6))*2.0;
  float sqSize = 1.0 / nSquaresX;
  vec2 floored = floor(uv / sqSize) * sqSize;

  vec2 delta = vec2(noise(vec3(floored.x * 190.0, floored.y * 31.0, iGlobalTime / 5.0)),
                    noise(vec3(floored.x * 117.0, floored.y * 94.0, iGlobalTime / 5.0)));
  vec2 m = mod(uv + delta * 0.003, vec2(sqSize)) / sqSize;

  float circAmt = 1.0-smoothstep(0.2, 0.25, distance(m, vec2(0.5)));

  float borderScale = 4.0;
  float borderX = sqSize * borderScale;
  float nSquaresY = floor(aspect / sqSize / 2.0) * 2.0;
  float halfHeightY = ((nSquaresY - borderScale - 2.0) * sqSize) / 2.0;

  float border = 1.0
    * step(borderX, floored.x + 0.5)
    * step(floored.y, halfHeightY)
    * step(borderX, 1.0 - (floored.x + 0.5))
    * step(-halfHeightY, floored.y);

  float noiseVal = noise(vec3(floored.x * 10.0, floored.y * 10.0, iGlobalTime / 30.0));


  vec3 circColor = mix(vec3(1.0), vec3(1.0, 1.0, 0.0), step(0.5, noiseVal));
  circColor *= circAmt * border;

  o = max(circColor, curled);

  gl_FragColor.rgb = o;
  gl_FragColor.a  = 1.0;
}
