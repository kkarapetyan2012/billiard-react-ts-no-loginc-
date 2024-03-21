import { useRef, useEffect, useState, FC } from 'react';

interface Ball {
  x: number;
  y: number;
  radius: number;
  color: string;
  vx: number;
  vy: number;
}

const BilliardBoard: FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [balls, setBalls] = useState<Ball[]>([
    { x: 50, y: 50, radius: 10, color: 'red', vx: 0, vy: 0 },
    { x: 100, y: 100, radius: 15, color: 'blue', vx: 0, vy: 0 },
    { x: 150, y: 150, radius: 20, color: 'yellow', vx: 0, vy: 0 },
    // Add more balls as needed
  ]);
  const [selectedBall, setSelectedBall] = useState<Ball | null>(null);

  const pushBall = (ball: Ball, dx: number, dy: number) => {
    ball.vx += dx;
    ball.vy += dy;
    setBalls([...balls]);
  };

  const checkBallCollision = (ball1: Ball, ball2: Ball) => {
    const dx = ball1.x - ball2.x;
    const dy = ball1.y - ball2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < ball1.radius + ball2.radius) {
      // Simple elastic collision
      const angle = Math.atan2(dy, dx);
      const speed1 = Math.sqrt(ball1.vx * ball1.vx + ball1.vy * ball1.vy);
      const speed2 = Math.sqrt(ball2.vx * ball2.vx + ball2.vy * ball2.vy);
      const direction1 = Math.atan2(ball1.vy, ball1.vx);
      const direction2 = Math.atan2(ball2.vy, ball2.vx);

      const velocityX1 = speed1 * Math.cos(direction1 - angle);
      const velocityY1 = speed1 * Math.sin(direction1 - angle);
      const velocityX2 = speed2 * Math.cos(direction2 - angle);
      const velocityY2 = speed2 * Math.sin(direction2 - angle);

      const finalVelocityX1 = ((ball1.radius - ball2.radius) * velocityX1 + 2 * ball2.radius * velocityX2) / (ball1.radius + ball2.radius);
      const finalVelocityX2 = ((ball2.radius - ball1.radius) * velocityX2 + 2 * ball1.radius * velocityX1) / (ball1.radius + ball2.radius);

      ball1.vx = Math.cos(angle) * finalVelocityX1 + Math.cos(angle + Math.PI / 2) * velocityY1;
      ball1.vy = Math.sin(angle) * finalVelocityX1 + Math.sin(angle + Math.PI / 2) * velocityY1;
      ball2.vx = Math.cos(angle) * finalVelocityX2 + Math.cos(angle + Math.PI / 2) * velocityY2;
      ball2.vy = Math.sin(angle) * finalVelocityX2 + Math.sin(angle + Math.PI / 2) * velocityY2;

      // Position correction to prevent balls from sticking together
      const overlap = ball1.radius + ball2.radius - distance;
      const correctionX = overlap * (dx / distance) / 2;
      const correctionY = overlap * (dy / distance) / 2;
      ball1.x += correctionX;
      ball1.y += correctionY;
      ball2.x -= correctionX;
      ball2.y -= correctionY;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const update = () => {
      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw the board
      ctx.fillStyle = 'green';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 10;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);

      // Update and draw balls
      balls.forEach((ball, index) => {
        // Update position
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Collision with walls
        if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
          ball.vx *= -0.9; // Lose some momentum
          ball.x = ball.x < canvas.width / 2 ? ball.radius : canvas.width - ball.radius;
        }
        if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
          ball.vy *= -0.9; // Lose some momentum
          ball.y = ball.y < canvas.height / 2 ? ball.radius : canvas.height - ball.radius;
        }

        // Check collision with other balls
        for (let j = index + 1; j < balls.length; j++) {
          checkBallCollision(ball, balls[j]);
        }

        // Draw the ball
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI);
        ctx.fillStyle = ball.color;
        ctx.fill();
      });

      requestAnimationFrame(update);
    };

    update();

    const handleMouseDown = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      let clickedBall = null;
      balls.forEach((ball) => {
        const dx = mouseX - ball.x;
        const dy = mouseY - ball.y;
        if (Math.sqrt(dx * dx + dy * dy) < ball.radius) {
            pushBall(ball, dx * 0.1, dy * 0.1);
            clickedBall = ball;
        }
      });

      setSelectedBall(clickedBall);
    };

    canvas.addEventListener('mousedown', handleMouseDown);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
    };
  }, [balls]);

  const handleColorChange = (color: string) => {
    if (selectedBall) {
      setBalls(
        balls.map((ball) =>
          ball === selectedBall ? { ...ball, color: color } : ball
        )
      );
      setSelectedBall(null);
    }
  };

  return (
    <div>
      <canvas ref={canvasRef} width={400} height={200}  />
      {selectedBall && (
        <div>
          <label htmlFor="colorPicker">Change color: </label>
          <input
            type="color"
            id="colorPicker"
            value={selectedBall.color}
            onChange={(e) => handleColorChange(e.target.value)}
          />
        </div>
      )}
    </div>
  );
};

export default BilliardBoard;

