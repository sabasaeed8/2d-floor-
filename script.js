const canvas = document.getElementById('floorplanCanvas');
const ctx = canvas.getContext('2d');
const tooltip = document.getElementById('tooltip');

let canvasWidth = window.innerWidth;
let canvasHeight = window.innerHeight;
canvas.width = canvasWidth;
canvas.height = canvasHeight;

let scaleFactor = 6;
let offsetX = 0;
let offsetY = 0;
let isDragging = false;
let dragStartX, dragStartY;

let furnitureData = [];
let floorplanData = {}; // Holds the parsed JSON data

// Fetch the JSON file and render the floor plan
fetch('sample.json')
    .then(response => response.json())
    .then(data => {
        floorplanData = data;
        furnitureData = data.Furnitures;
        drawFloorplan();
    });

// Function to draw the floorplan, including regions, doors, and furniture
function drawFloorplan() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scaleFactor, scaleFactor);

    // Draw regions (walls)
    floorplanData.Regions.forEach(region => {
        const startX = region[0].X;
        const startY = region[0].Y;
        const endX = region[1].X;
        const endY = region[1].Y;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.stroke();
    });

    // Draw doors
    floorplanData.Doors.forEach(door => {
        const doorX = door.Location.X;
        const doorY = door.Location.Y;
        const doorWidth = door.Width;
        const doorRotation = door.Rotation;

        const halfWidth = doorWidth / 2;

        // Draw door line (straight line perpendicular to the wall)
        const lineStartX = doorX - halfWidth * Math.cos(doorRotation);
        const lineStartY = doorY - halfWidth * Math.sin(doorRotation);
        const lineEndX = doorX + halfWidth * Math.cos(doorRotation);
        const lineEndY = doorY + halfWidth * Math.sin(doorRotation);

        ctx.beginPath();
        ctx.moveTo(lineStartX, lineStartY);
        ctx.lineTo(lineEndX, lineEndY);
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw door arc (open arc connecting the wall)
        ctx.beginPath();
        ctx.arc(doorX, doorY, halfWidth, doorRotation, doorRotation + Math.PI / 2);
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 1;
        ctx.stroke();
    });

    // Draw furniture
    furnitureData.forEach(furniture => {
        const minX = furniture.MinBound.X;
        const maxX = furniture.MaxBound.X;
        const minY = furniture.MinBound.Y;
        const maxY = furniture.MaxBound.Y;

        const furnitureWidth = maxX - minX;
        const furnitureHeight = maxY - minY;

        const furnitureX = furniture.xPlacement;
        const furnitureY = furniture.yPlacement;
        const rotation = furniture.rotation;

        ctx.save();
        ctx.translate(furnitureX, furnitureY);
        ctx.rotate(rotation);

        // Draw furniture as a rectangle
        ctx.fillStyle = 'green';
        ctx.fillRect(-furnitureWidth / 2, -furnitureHeight / 2, furnitureWidth, furnitureHeight);

        ctx.restore();
    });

    ctx.restore();
}

// Event listeners for dragging
canvas.addEventListener('mousedown', (e) => {
    const canvasRect = canvas.getBoundingClientRect();
    isDragging = true;
    dragStartX = e.clientX - canvasRect.left - offsetX; // Adjust for canvas offset
    dragStartY = e.clientY - canvasRect.top - offsetY;  // Adjust for canvas offset
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
});

// Event listener for mouse movement to show tooltip
canvas.addEventListener('mousemove', (e) => {
    const canvasRect = canvas.getBoundingClientRect();
    
    // Handle dragging
    if (isDragging) {
        offsetX = e.clientX - canvasRect.left - dragStartX;  // Adjust for canvas offset
        offsetY = e.clientY - canvasRect.top - dragStartY;   // Adjust for canvas offset
        drawFloorplan();
    }

    // Handle tooltip for hovering over furniture
    const mouseX = (e.clientX - canvasRect.left - offsetX) / scaleFactor;  // Adjust for canvas offset
    const mouseY = (e.clientY - canvasRect.top - offsetY) / scaleFactor;   // Adjust for canvas offset

    let hoveredFurniture = null;

    furnitureData.forEach(furniture => {
        const furnitureX = furniture.xPlacement;
        const furnitureY = furniture.yPlacement;
        const minX = furniture.MinBound.X;
        const maxX = furniture.MaxBound.X;
        const minY = furniture.MinBound.Y;
        const maxY = furniture.MaxBound.Y;

        const furnitureWidth = maxX - minX;
        const furnitureHeight = maxY - minY;

        const furnitureLeft = furnitureX - furnitureWidth / 2;
        const furnitureRight = furnitureX + furnitureWidth / 2;
        const furnitureTop = furnitureY - furnitureHeight / 2;
        const furnitureBottom = furnitureY + furnitureHeight / 2;

        if (mouseX >= furnitureLeft && mouseX <= furnitureRight && mouseY >= furnitureTop && mouseY <= furnitureBottom) {
            hoveredFurniture = furniture;
        }
    });

    if (hoveredFurniture) {
        tooltip.style.left = e.pageX + 'px';
        tooltip.style.top = e.pageY + 'px';
        tooltip.innerHTML = hoveredFurniture.equipName;
        tooltip.style.display = 'block';
    } else {
        tooltip.style.display = 'none';
    }
});


// Zoom functionality using mouse wheel
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    if (e.deltaY < 0) {
        scaleFactor *= zoomFactor;
    } else {
        scaleFactor /= zoomFactor;
    }
    drawFloorplan();
});

// Handle window resize
window.addEventListener('resize', () => {
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    drawFloorplan();
});
