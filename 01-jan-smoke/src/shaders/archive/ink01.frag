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
  vec2 texCoord = gl_FragCoord.xy / iResolution.xy;
  vec2 uv = texCoord - vec2(0.5);
  uv.y *= iResolution.y / iResolution.x;

  vec3 o = vec3(0.0);

  //float n = noise(vec3(uv, sin(iGlobalTime)));
  //float o = texture2D(lastTex, uv).r;

  vec2 grad = findGradNoise(texCoord, iGlobalTime);
  vec3 c = texture2D(lastTex, texCoord + grad / 100.0).rgb;

  //vec3 orig = texture2D(colorMap, uv).rgb;
  //orig = step(vec3(0.7), orig * abs(cos(iGlobalTime)));

  vec3 curl = curlNoise(vec3(texCoord, iGlobalTime / 30.0));
  curl /= 300.0;
  vec3 curled = texture2D(lastTex, texCoord + curl.xy).rgb;

  float angle = atan(uv.y, uv.x);
  float angleAmt = mod((angle + iGlobalTime / 3.0 + 3.14159) / (3.14159 * 2.0), 1.0);
  float audioVal = texture2D(audioTex, vec2(angleAmt, 1.0)).r;

  float dist = sin(iGlobalTime) * 0.05 + 0.25;
  float distFromCenter = distance(uv, vec2(0.));
  float circAmt = 1.0 - smoothstep(audioVal * 0.05, audioVal * 0.07, abs(dist-distFromCenter));

  vec3 circColor;
  //circColor = vec3(0.5, abs(sin(uv.x + iGlobalTime)), abs(cos(uv.y + iGlobalTime)));
  circColor = vec3(1.0);
  circColor *= circAmt;

  curled = smoothstep(vec3(0.05), vec3(0.1), curled) * curled * 0.993;
  o = max(circColor, curled);

  gl_FragColor.rgb = o;
  gl_FragColor.a  = 1.0;
}
