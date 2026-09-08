type DegreeWatermarkSlot = {
  left: `${number}%`;
  opacity: number;
  rotation: `${number}deg`;
  top: `${number}%`;
};

const maximumDegreeWatermarks = 8;
const circleCenter = 50;
const minimumRadius = 37;
const maximumRadius = 41;
const maximumAngleJitter = 10;
const minimumOpacity = 0.14;
const maximumOpacity = 0.22;

/** Creates a randomly varied circular degree layout that stays inside the FlashCard. */
export function createDegreeWatermarkSlots(
  degreeCount: number,
  random: () => number = Math.random,
): readonly DegreeWatermarkSlot[] {
  const count = Math.min(Math.max(Math.floor(degreeCount), 0), maximumDegreeWatermarks);

  return Array.from({ length: count }, (_, index) => {
    const baseAngle = (Math.PI * 2 * index) / count - Math.PI / 2;
    const angleJitter = degreesToRadians(
      randomInRange(random, -maximumAngleJitter, maximumAngleJitter),
    );
    const angle = baseAngle + angleJitter;
    const radius = randomInRange(random, minimumRadius, maximumRadius);

    return {
      left: `${circleCenter + radius * Math.cos(angle)}%`,
      opacity: randomInRange(random, minimumOpacity, maximumOpacity),
      rotation: `${randomInRange(random, -maximumAngleJitter, maximumAngleJitter)}deg`,
      top: `${circleCenter + radius * Math.sin(angle)}%`,
    };
  });
}

function degreesToRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function randomInRange(random: () => number, minimum: number, maximum: number) {
  return minimum + random() * (maximum - minimum);
}
