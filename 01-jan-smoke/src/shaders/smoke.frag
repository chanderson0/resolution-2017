precision mediump float;

uniform float globalTime;
uniform sampler2D lastTex;
uniform vec3 resolution;

#pragma glslify: noise = require("glsl-noise/simplex/3d")
#pragma glslify: curlNoise = require("glsl-curl-noise/curl")

vec3 circles(vec2 uv, float aspect) {
  float nSquaresX = floor(pow(resolution.x, 1.0/2.4))*2.0;
  float sqSize = 1.0 / nSquaresX;
  float circSize = 0.1 + noise(vec3(uv.x * 4.0, uv.y * 4.0, globalTime / 5.0)) * 0.1;
  vec2 whichBox = floor(uv / sqSize);
  vec2 floored = whichBox * sqSize;
  vec2 m = mod(uv, vec2(sqSize)) / sqSize;

  float circAmt = 1.0-smoothstep(circSize, circSize + 0.05, distance(m, vec2(0.5)));

  float borderScale = floor(nSquaresX / 4.0 / 2.0) * 2.0;
  float borderX = sqSize * borderScale;
  float nSquaresY = floor(aspect / sqSize / 2.0) * 2.0;
  float halfHeightY = ((nSquaresY - borderScale) * sqSize) / 2.0;

  float border = 1.0
    * step(borderX, floored.x + 0.5)
    * step(floored.y, halfHeightY)
    * step(borderX, 1.0 - (floored.x + 0.5))
    * step(-halfHeightY, floored.y);

  float d = length(uv);

  // White
  vec3 circColor = vec3(1.0);

  return circColor * circAmt * border;;
}

vec3 curl(vec2 texCoord) {
  vec3 curl = curlNoise(vec3(texCoord, globalTime / 10.0)) / 300.0;
  vec3 curled = texture2D(lastTex, texCoord + curl.xy).rgb;

  // Decay
  curled -= abs(noise(vec3(globalTime / 10.0))) * 0.005 + 0.003;

  // Step down to 0 at some point
  curled *= smoothstep(vec3(0.001), vec3(0.06), curled);

  return curled;
}

void main() {
  float aspect = resolution.y / resolution.x;
  vec2 texCoord = gl_FragCoord.xy / resolution.xy;
  vec2 uv0 = texCoord;
  uv0.y *= aspect;
  vec2 uv = texCoord - vec2(0.5);
  uv.y *= aspect;

  vec3 circled = circles(uv, aspect);
  vec3 curled = curl(texCoord);

  gl_FragColor.rgb = max(circled, curled);
  gl_FragColor.a  = 1.0;
}
