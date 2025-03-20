// Import D3.js library
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// Constants and configuration
const biomeData = {
    "atlantic-forest": { 
        name: "Atlantic Forest", 
        color: "#2E8B57",
        colorFinger: "#2e8b5799",
        index: 0,
        path: "M267.37,118.71c44.44,6.18,80.76,34.38,82.96,54.47,3.26,29.68-36.8,59.52-85.8,71.49-38.65,9.44-75.65-19.83-75.65-59.95s33.81-72.23,78.48-66.01Z",
        labelX: 258,
        labelY: 185
    },
    "pantanal": { 
        name: "Pantanal", 
        color: "#806D43",
        colorFinger: "#806d4399",
        index: 1,
        path: "M171.67,244.19c41.58,7.99,70.07,33.91,70.07,63.04s-18.78,32.78-61.93,28.44c-50.07-5.04-80.63-12.3-80.63-41.43s29.9-58.24,72.48-50.06Z",
        labelX: 170,
        labelY: 270
    },
    "cerrado": { 
        name: "Cerrado", 
        color: "#CD853F",
        colorFinger: "#cd853f99",
        index: 2,
        path: "M203.52,17.6c47.21-8.65,72.3-10.58,72.3,20.97s-28.17,68.47-75.56,74.51c-49.78,6.35-88.59-25.66-83.3-56.52,3.24-18.85,41.35-30.68,86.56-38.96Z",
        labelX: 200,
        labelY: 90
    }
};

const biomeIds = Object.keys(biomeData);
const biomeElements = {};

// Main container setup
const container = d3.select("#chart-container");
const fingerLabels = {};

// Create SVG structure for tapir selector
const selectorContainer = container.append("div").attr("class", "tapir-selector-container");
const selectorSvg = selectorContainer.append("svg")
    .attr("viewBox", "50 45 330 270")
    .attr("width", "100%")
    .attr("height", "100%");

// Create shadow filter
const defs = selectorSvg.append("defs");
defs.append("filter")
    .attr("id", "shadow")
    .attr("x", "-20%")
    .attr("y", "-20%")
    .attr("width", "140%")
    .attr("height", "140%")
    .append("feDropShadow")
    .attr("dx", "4")
    .attr("dy", "4")
    .attr("stdDeviation", "4")
    .attr("flood-color", "rgba(0, 0, 0, 0.1)");

// Create tapir structure
const tapirGroup = selectorSvg.append("g").attr("transform", "scale(0.8) translate(50, 50)");

// Main body with message
tapirGroup.append("path")
    .attr("d", "M92.6,299.04c1.27.22,2.42-.8,2.4-2.09-.07-5.69-.08-7.62.17-10.11,2.44-24.69,18.69-50.57,62.06-50.57,1.97,0,5.82.2,12.59,1.84,2.17.52,4.37.93,6.59,1.19s4.46.46,6.61.56c8.2.38,13.71-8.3,9.91-15.57-15.45-29.5-14.5-34.24-14.95-42.79-.41-7.75,1.87-19.66,14.85-38.95,5.84-8.68.66-20.5-9.7-21.94-3.75-.52-8.77-1.08-15.83-1.9-10.62-1.23-26.19-7.66-34.41-14.49-11.7-9.73-19.12-21.13-23.48-35.47-.94-3.11-2.74-3.85-4.61-3.89-6.09-.11-22.33,4.94-27.44,7.52C35.11,93.71,1.56,131.04.52,182.47c-1.3,64.57,56.07,101.49,79.56,111.35.12.05.23.1.35.17,1.19.63,8.3,4.38,12.16,5.05Z")
    .attr("class", "tapir-body")
    .attr("filter", "url(#shadow)");

// Add message text to main body
tapirGroup.append("text")
    .attr("x", 90)
    .attr("y", 180)
    .attr("class", "tapir-message")
    .append("tspan")
    .text("Pick up a tapir:")
    .attr("x", 87)
    .attr("dy", 0)
    .append("tspan")
    .text("Select a toe")
    .attr("x", 95)
    .attr("dy", "1.2em");

// Create each finger and store references
biomeIds.forEach(id => {
    const data = biomeData[id];
    
    // Create finger element
    const finger = tapirGroup.append("path")
        .attr("d", data.path)
        .attr("class", `tapir-finger ${id}-finger`)
        .attr("fill", "#d1d1d1")
        .attr("filter", "url(#shadow)")
        .on("click", event => {
            event.stopPropagation();
            openBiomeSelector(id);
        });
    
    // Store in biomeElements for later reference
    biomeElements[id] = {
        finger: finger,
        dropdown: null
    };
    
    // Add label
    const labelContainer = selectorSvg.append("g")
        .attr("class", "tapir-finger-label")
        .attr("data-biome", id)
        .on("click", event => {
            event.stopPropagation();
            openBiomeSelector(id);
        });
    
    // Add text element
    const textElement = labelContainer.append("text")
        .attr("x", data.labelX)
        .attr("y", data.labelY)
        .attr("class", "finger-label-text")
        .text(data.name);
    
    // Store label reference
    fingerLabels[id] = textElement;
});

// Create hidden dropdowns and modal
const dropdownsContainer = container.append("div").attr("class", "hidden-dropdowns");
const modalContainer = container.append("div").attr("class", "biome-modal");
const modalTitle = modalContainer.append("h3").attr("class", "modal-title");
const selectionList = modalContainer.append("div").attr("class", "selection-list");

// Create dropdowns for each biome
biomeIds.forEach(id => {
    const dropdown = dropdownsContainer.append("div")
        .attr("class", "dropdown-container")
        .append("select")
        .attr("id", `${id}-select`);
    
    // Store dropdown reference
    biomeElements[id].dropdown = dropdown;
});

// Function to open biome selector
function openBiomeSelector(biomeId) {
    const biomeName = biomeData[biomeId].name;
    const dropdown = biomeElements[biomeId].dropdown;
    const fingerElement = biomeElements[biomeId].finger;
    
    // Check if modal is already open for this biome
    if (modalContainer.style("display") === "block" && 
        modalContainer.attr("data-current-biome") === biomeId) {
        closeModal();
        return;
    }
    
    // Set modal title and current biome
    modalTitle.text(biomeName);
    modalContainer.attr("data-current-biome", biomeId);
    
    // Clear previous options
    selectionList.html("");
    
    // Get options from dropdown
    const options = Array.from(dropdown.node().options).slice(2); // Skip None and All
    
    // Create standard options
    ["None", "All"].forEach(option => {
        const value = option.toLowerCase();
        selectionList.append("div")
            .attr("class", "selection-option")
            .classed("selected", dropdown.property("value") === value)
            .text(option)
            .on("click", event => {
                event.stopPropagation();
                dropdown.property("value", value);
                fingerElement.attr("fill", value === "none" ? "#d1d1d1" : biomeData[biomeId].colorFinger);
                fingerLabels[biomeId].text(biomeName);
                closeModal();
                dropdown.dispatch("change");
            });
    });
    
    // Add individual options
    options.forEach(option => {
        selectionList.append("div")
            .attr("class", "selection-option")
            .classed("selected", dropdown.property("value") === option.value)
            .text(option.text)
            .on("click", event => {
                event.stopPropagation();
                dropdown.property("value", option.value);
                fingerElement.attr("fill", biomeData[biomeId].colorFinger);
                fingerLabels[biomeId].text(option.text);
                closeModal();
                dropdown.dispatch("change");
            });
    });
    
    // Show modal
    modalContainer.style("display", "block");
}

// Function to close modal
function closeModal() {
    modalContainer.style("display", "none");
}

// Add click handler to close modal when clicking outside
document.addEventListener('click', event => {
    if (modalContainer.style("display") !== 'none') {
        const modalElement = modalContainer.node();
        if (!modalElement.contains(event.target)) {
            const isTapirPart = 
                event.target.classList.contains('tapir-finger') ||
                event.target.classList.contains('tapir-finger-label') ||
                (event.target.parentNode && 
                 event.target.parentNode.classList && 
                 event.target.parentNode.classList.contains('tapir-finger-label'));
            
            if (!isTapirPart) {
                closeModal();
            }
        }
    }
});

// Create main chart container and SVG
const chartDiv = container.append("div").attr("id", "main-chart");
const svg = chartDiv.append("svg")
    .attr("width", 400)
    .attr("height", 400);

// Load dataset
d3.csv('data/results_distance_join.csv', d3.autoType)

    .then(tapirs => {
        // Ensure numeric values
        tapirs.forEach(d => {
            d.hour = +d.hour;
            d.count = +d.distance_per_point_meters;
        });

        // Group data
        const groupedTapirs = d3.group(tapirs, d => d.individual_name);
        
        // Group by biome
        const biomeGroups = {};
        Object.values(biomeData).forEach(data => biomeGroups[data.name] = []);
        
        Array.from(groupedTapirs.entries()).forEach(([individual, data]) => {
            const biome = data[0].Biome;
            if (biomeGroups[biome]) {
                biomeGroups[biome].push([individual, data]);
            }
        });

        // Populate dropdowns
        biomeIds.forEach(id => {
            const dropdown = biomeElements[id].dropdown;
            const biomeName = biomeData[id].name;
            
            // Add None and All options
            dropdown.append("option").attr("value", "none").text("None");
            dropdown.append("option").attr("value", "all").text("All");
            
            // Add individuals sorted alphabetically
            const sortedIndividuals = [...biomeGroups[biomeName]].sort((a, b) => 
                a[0].localeCompare(b[0])
            );
            
            sortedIndividuals.forEach(([individual, _]) => {
                dropdown.append("option")
                    .attr("value", individual)
                    .text(individual);
            });
            
            // Add change listener
            dropdown.on("change", updatePlot);
        });

        // Update plot function
        function updatePlot() {
            svg.selectAll("*").remove();
            
            // Collect selected data
            const selectedData = [];
            
            biomeIds.forEach(id => {
                const biomeName = biomeData[id].name;
                const dropdown = biomeElements[id].dropdown;
                const selection = dropdown.property("value");
                const fingerElement = biomeElements[id].finger;
                
                // Update finger color
                fingerElement.attr("fill", selection !== "none" ? 
                    biomeData[id].colorFinger : "#d1d1d1");
                
                // Update label text
                fingerLabels[id].text(selection === "none" || selection === "all" ? 
                    biomeName : selection);
                
                // Add to selected data
                if (selection === "all") {
                    biomeGroups[biomeName].forEach(([individual, data]) => {
                        selectedData.push({
                            individual,
                            biome: biomeName,
                            data: data.sort((a, b) => a.hour - b.hour)
                        });
                    });
                } else if (selection !== "none") {
                    const data = groupedTapirs.get(selection);
                    selectedData.push({
                        individual: selection,
                        biome: biomeName,
                        data: data.sort((a, b) => a.hour - b.hour)
                    });
                }
            });
            
            // Draw visualization
            if (selectedData.length === 0) {
                drawEmptyClockStructure();
            } else {
                drawMultiCircularLinePlot(selectedData);
            }
        }
        
        // Initial plot
        updatePlot();
    })
    .catch(error => console.error("Error loading CSV:", error));

// Function to draw circular line plot
function drawMultiCircularLinePlot(selectedData) {
    const width = 400, height = 400;
    const radius = Math.min(width, height) / 2 - 60;
    
    // Create centered group
    const g = svg.append("g").attr("transform", `translate(${width / 2}, ${height / 2})`);
    
    // Set up scales
    const angleScale = d3.scaleLinear().domain([0, 24]).range([0, 2 * Math.PI]);
    const adjustedAngle = hour => angleScale(hour) - Math.PI/2;
    
    // Find maximum count
    const maxCount = d3.max(selectedData, item => d3.max(item.data, d => d.count));
    const radiusScale = d3.scaleLinear().domain([0, maxCount]).range([0, radius]);
    
    // Draw boundary and grid
    drawClockStructure(g, radius, adjustedAngle, maxCount, radiusScale);
    
    // Draw data lines
    const lineGenerator = d3.line();
    
    selectedData.forEach(item => {
        const biomeId = Object.keys(biomeData).find(id => biomeData[id].name === item.biome);
        const fillColor = biomeData[biomeId].color;
        const safeId = item.individual.replace(/\s+/g, '-');
        
        // Create line points
        const linePoints = item.data.map(d => {
            const angle = adjustedAngle(d.hour);
            const r = radiusScale(d.count);
            return [r * Math.cos(angle), r * Math.sin(angle)];
        });
        
        // Close the path
        if (linePoints.length > 0) {
            linePoints.push(linePoints[0]);
        }
        
        // Draw filled area
        g.append("path")
            .attr("class", `radar-area-${safeId}`)
            .attr("d", lineGenerator(linePoints))
            .attr("fill", fillColor)
            .attr("fill-opacity", 0.2);
        
        // Create hover detection area
        g.append("path")
            .attr("class", `radar-hover-${safeId}`)
            .attr("d", lineGenerator(linePoints))
            .attr("fill", "none")
            .attr("stroke", "transparent")
            .attr("stroke-width", 15)
            .style("pointer-events", "stroke")
            .on("mouseover", function() {
                d3.select(`.radar-line-${safeId}`).attr("stroke-width", 4);
                d3.select(".tooltip")
                    .style("visibility", "visible")
                    .html(`<strong>${item.individual}</strong><br>Biome: ${item.biome}`);
            })
            .on("mousemove", function(event) {
                // Get coordinates
                const [mouseX, mouseY] = d3.pointer(event, svg.node());
                const centerX = width / 2;
                const centerY = height / 2;
                const dx = mouseX - centerX;
                const dy = mouseY - centerY;
                
                // Convert to polar coordinates
                const angle = Math.atan2(dy, dx);
                let hour = (angle + Math.PI/2) / (2 * Math.PI) * 24;
                hour = (hour + 24) % 24;
                
                // Find closest point
                const sortedData = [...item.data].sort((a, b) => 
                    Math.abs(a.hour - hour) - Math.abs(b.hour - hour)
                );
                const closestPoint = sortedData[0];
                
                // Update tooltip
                d3.select(".tooltip")
                    .html(`<strong>${item.individual}</strong> (${item.biome})<br>` +
                         `Hour: ${Math.round(closestPoint.hour)}:00<br>` +
                         `Distance: ${closestPoint.count.toFixed(1)}`)
                    .style("top", `${event.pageY - 30}px`)
                    .style("left", `${event.pageX + 10}px`);
            })
            .on("mouseout", function() {
                d3.select(`.radar-line-${safeId}`).attr("stroke-width", 2);
                d3.select(".tooltip").style("visibility", "hidden");
            });
        
        // Draw visible line
        g.append("path")
            .attr("class", `radar-line-${safeId}`)
            .attr("d", lineGenerator(linePoints))
            .attr("fill", "none")
            .attr("stroke", fillColor)
            .attr("stroke-width", 2);
    });
    
    // Add tooltip if needed
    if (d3.select("body").select(".tooltip").empty()) {
        d3.select("body").append("div").attr("class", "tooltip");
    }
}

// Function to draw clock structure for both empty and data views
function drawClockStructure(g, radius, adjustedAngle, maxCount, radiusScale) {
    // Draw boundary circle
    g.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", radius)
        .attr("class", "boundary-circle");
    
    // Draw grid lines
    if (maxCount && radiusScale) {
        const gridStep = maxCount / 5;
        for (let i = gridStep; i <= maxCount; i += gridStep) {
            // Draw circular grid
            g.append("circle")
                .attr("class", "circular-grid-line")
                .attr("cx", 0)
                .attr("cy", 0)
                .attr("r", radiusScale(i));
            
            // Add scale label
            g.append("text")
                .attr("class", "scale-label")
                .attr("x", 0)
                .attr("y", -radiusScale(i))
                .attr("dy", "3px")
                .text(Math.round(i));
        }
    } else {
        // Draw empty grid circles
        [0.2, 0.4, 0.6, 0.8, 1.0].forEach(step => {
            g.append("circle")
                .attr("class", "circular-grid-line")
                .attr("cx", 0)
                .attr("cy", 0)
                .attr("r", radius * step);
        });
    }
    
    // Draw radial lines
    g.selectAll(".radial-grid-line")
        .data(d3.range(0, 24, 3))
        .enter().append("line")
        .attr("class", "radial-grid-line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", d => radius * Math.cos(adjustedAngle(d)))
        .attr("y2", d => radius * Math.sin(adjustedAngle(d)));
    
    // Define time labels
    const hourToLabel = {
        0: "Midnight",
        6: "Dawn",
        12: "Noon",
        18: "Dusk"
    };
    
    // Add hour labels
    g.selectAll(".hour-label")
        .data(d3.range(0, 24, 3))
        .enter().append("text")
        .attr("class", "hour-label")
        .attr("x", d => (radius + 25) * Math.cos(adjustedAngle(d)))
        .attr("y", d => (radius + 20) * Math.sin(adjustedAngle(d)))
        .text(d => hourToLabel[d] || `${d}:00`);
}

// Function to draw empty clock structure
function drawEmptyClockStructure() {
    const width = 400, height = 400;
    const radius = Math.min(width, height) / 2 - 60;
    
    // Create centered group
    const g = svg.append("g").attr("transform", `translate(${width / 2}, ${height / 2})`);
    
    // Set up angle scale
    const angleScale = d3.scaleLinear().domain([0, 24]).range([0, 2 * Math.PI]);
    const adjustedAngle = hour => angleScale(hour) - Math.PI/2;
    
    // Draw clock structure
    drawClockStructure(g, radius, adjustedAngle);
}



/* ============================= */
/* ====== MODIFIED MAPBOX CODE ====== */
/* ============================= */

// Replace with your actual Mapbox Access Token
mapboxgl.accessToken = 'pk.eyJ1IjoieXVyaXNzb3V6YSIsImEiOiJjbThncGNkbWowb2FjMmpvOXc2ejhmdnAzIn0.9WvDM-DlIVcXImsxIPKeXw';

// Initialize Mapbox map
const map = new mapboxgl.Map({
    container: 'map', // ID of the div where the map will be displayed
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [-53.7, -21], // Adjust to match Tapir locations
    zoom: 6.9,
    bearing: 0,
    pitch: 0,
});

// Add zoom and rotation controls
map.addControl(new mapboxgl.NavigationControl());

// Function to generate a unique color for each individual
const getColorForID = (id) => {
    const colors = [
        '#d93636', '#d94336', '#d95136', '#d95e36', '#d96b36', '#d97836', '#d98536',
        '#d99236', '#d9a036', '#d9ad36', '#d9ba36', '#d9c736', '#d9d436', '#d0d936',
        '#c3d936', '#b6d936', '#a8d936', '#9bd936', '#8ed936', '#81d936', '#74d936',
        '#67d936', '#59d936', '#4cd936', '#3fd936', '#36d93b', '#36d948', '#36d955',
        '#36d962', '#36d96f', '#36d97c', '#36d98a', '#36d997', '#36d9a4', '#36d9b1',
        '#36d9be', '#36d9cc', '#36d9d9', '#36ccd9', '#36bed9', '#36b1d9', '#36a4d9',
        '#3697d9', '#368ad9', '#367cd9', '#366fd9', '#3662d9', '#3655d9', '#3648d9',
        '#363bd9', '#3f36d9', '#4c36d9', '#5936d9', '#6736d9', '#7436d9', '#8136d9',
        '#8e36d9', '#9b36d9', '#a836d9', '#b636d9', '#c336d9', '#d036d9', '#d936d4',
        '#d936c7', '#d936ba', '#d936ad', '#d936a0', '#d93692', '#d93685', '#d93678',
        '#d9366b', '#d9365e', '#d93651', '#d93643'
    ];
    const hash = [...id].reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length]; // Assign color based on hash value
};

// Load CSV data
d3.csv('data/df_merged_na_coord3.csv', d3.autoType).then(data => {
    console.log("✅ Loaded CSV Data:", data);

    // Filter valid coordinate points
    const validData = data.filter(d => !isNaN(d.Longitude) && !isNaN(d.Latitude));

    if (validData.length === 0) {
        console.error("❌ No valid coordinates found.");
        return;
    }

    console.log(`📍 Found ${validData.length} valid points`);

    // Group data by individual
    const groupedIndividuals = d3.group(validData, d => d["individual_local_identifier"]);

    // Store movement tracks (lines)
    let movementTracks = [];

    // Create lookup to store individual data for popups
    const individualDataLookup = new Map();

    groupedIndividuals.forEach((individualData, individual) => {
        // Sort each individual's data by timestamp
        individualData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        // Extract coordinates for movement tracking
        const coordinates = individualData.map(d => [d.Longitude, d.Latitude]);

        if (coordinates.length > 1) {
            // Store track data for popup display
            individualDataLookup.set(individual, {
                coordinates,
                points: individualData.map(point => ({
                    Record_ID: point.ID || point.Record_ID || '',
                    timestamp: point.timestamp || '',
                    Longitude: point.Longitude || '',
                    Latitude: point.Latitude || '',
                    Biome: point.Biome || '',
                    sex: point.sex || '',
                    age: point.age || '',
                    individual_name: point.individual_name || point.individual_local_identifier || ''
                }))
            });

            movementTracks.push({
                type: "Feature",
                properties: { 
                    individual,
                    color: getColorForID(individual),
                    startTime: individualData[0].timestamp,
                    endTime: individualData[individualData.length-1].timestamp
                },
                geometry: {
                    type: "LineString",
                    coordinates
                }
            });
        }
    });

    // Add movement tracking lines with individual colors
    if (movementTracks.length > 0) {
        map.addSource("movement-tracks", {
            type: "geojson",
            data: {
                type: "FeatureCollection",
                features: movementTracks
            }
        });

        // Add a single layer for all tracks
        map.addLayer({
            id: `movement-lines`,
            type: "line",
            source: "movement-tracks",
            paint: {
                "line-color": ["get", "color"],
                "line-width": 1,
                "line-opacity": 0.5
            }
        });

        // Handle click events on lines
        map.on('click', 'movement-lines', (e) => {
            // Get properties of the clicked line
            const features = map.queryRenderedFeatures(e.point, { layers: ['movement-lines'] });
            if (!features.length) return;
            
            const { individual, startTime, endTime } = features[0].properties;
            const coords = e.lngLat;
            
            // Get additional data from our lookup
            const individualData = individualDataLookup.get(individual);
            
            // Get the point closest to where the user clicked
            const clickPoint = [coords.lng, coords.lat];
            
            // Find the closest point in the track to display relevant data
            let closestPointData = individualData.points[0];
            let minDistance = Infinity;
            
            individualData.points.forEach(point => {
                const pointCoords = [point.Longitude, point.Latitude];
                const distance = Math.sqrt(
                    Math.pow(pointCoords[0] - clickPoint[0], 2) + 
                    Math.pow(pointCoords[1] - clickPoint[1], 2)
                );
                
                if (distance < minDistance) {
                    minDistance = distance;
                    closestPointData = point;
                }
            });
            
            // Create popup with requested columns in specified order
            new mapboxgl.Popup()
                .setLngLat(coords)
                .setHTML(`
                    <strong>Name:</strong> ${closestPointData.individual_name}<br>
                    <strong>Sex:</strong> ${closestPointData.sex}<br>
                    <strong>Age:</strong> ${closestPointData.age}<br>
                    <strong>Biome:</strong> ${closestPointData.Biome}<br>
                    <strong>Timestamp:</strong> ${closestPointData.timestamp}<br>
                    <strong>Latitude:</strong> ${closestPointData.Latitude.toFixed(6)}<br>
                    <strong>Longitude:</strong> ${closestPointData.Longitude.toFixed(6)}<br>
                    <strong>Record ID:</strong> ${closestPointData.Record_ID}
                `)
                .addTo(map);
        });
        
        // Change cursor when hovering over lines
        map.on('mouseenter', 'movement-lines', () => {
            map.getCanvas().style.cursor = 'pointer';
        });
        
        map.on('mouseleave', 'movement-lines', () => {
            map.getCanvas().style.cursor = '';
        });
    }

}).catch(error => {
    console.error("❌ Error loading CSV:", error);
});