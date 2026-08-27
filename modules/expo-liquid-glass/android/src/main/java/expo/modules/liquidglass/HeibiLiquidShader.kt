package expo.modules.liquidglass

/**
 * Independently authored for heibi's bounded Checkpoint 4 prototype.
 *
 * Convx is GPL-3.0 research evidence only. No Convx implementation or shader
 * source was copied, translated, or adapted into this program.
 */
internal const val HEIBI_LIQUID_SHADER = """
  uniform shader content;
  uniform float2 size;
  uniform float2 touch;
  uniform float press;
  uniform float strength;

  half4 main(float2 point) {
    float2 safeSize = max(size, float2(1.0, 1.0));
    float2 center = mix(safeSize * 0.5, touch, press);
    float2 delta = (point - center) / safeSize;
    float aspect = max(safeSize.x / safeSize.y, 0.0001);
    delta.x *= aspect;

    float radius = length(delta);
    float influence = 1.0 - smoothstep(0.08, 0.56, radius);
    float safeRadius = max(radius, 0.0001);
    float2 direction = delta / safeRadius;
    direction.x /= aspect;

    float response = 0.35 + (0.65 * press);
    float2 offset = direction * strength * influence * response;
    float2 samplePoint = clamp(
      point - offset,
      float2(0.0, 0.0),
      safeSize - float2(1.0, 1.0)
    );
    return content.eval(samplePoint);
  }
"""
