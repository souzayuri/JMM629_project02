// Import the D3.js library from the specified CDN
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

console.log(d3); // Check if D3 is loaded

// User style configuration
const userStyle = "Normal"; // Style setting for the visualization

// Define biome color mapping, associating specific biomes with colors
const biomeColors = {
    "Atlantic Forest": "#2E8B57", // Green color for Atlantic Forest
    "Pantanal": "#806D43", // Brown color for Pantanal
    "Cerrado": "#CD853F" // Orange color for Cerrado
};

// Biome sorting order
const biomeOrder = ["Atlantic Forest", "Pantanal", "Cerrado"];

// Main container setup
const container = d3.select("#chart-container");

// Create dropdown containers - one for each biome
const atlanticForestContainer = container.append("div")
    .attr("class", "dropdown-container");

const pantanalContainer = container.append("div")
    .attr("class", "dropdown-container");

const cerradoContainer = container.append("div")
    .attr("class", "dropdown-container");

// Add labels for dropdowns
atlanticForestContainer.append("label")
    .attr("for", "atlantic-forest-select")
    .text("Atlantic Forest: ");

pantanalContainer.append("label")
    .attr("for", "pantanal-select")
    .text("Pantanal: ");

cerradoContainer.append("label")
    .attr("for", "cerrado-select")
    .text("Cerrado: ");

// Create the dropdown elements
const atlanticForestDropdown = atlanticForestContainer.append("select")
    .attr("id", "atlantic-forest-select");

const pantanalDropdown = pantanalContainer.append("select")
    .attr("id", "pantanal-select");

const cerradoDropdown = cerradoContainer.append("select")
    .attr("id", "cerrado-select");

// No update button needed anymore as changes will be automatic

// Create the main chart container
const chartDiv = container.append("div")
    .attr("id", "main-chart");

// Create SVG element for the plot
const svg = chartDiv.append("svg")
    .attr("width", 400)
    .attr("height", 400);

// Function to clear the SVG for redraws
function clearSVG() {
    svg.selectAll("*").remove();
}

// Load the dataset
d3.csv('data/activity_summary2.csv', d3.autoType)
    .then(tapirs => {
        console.log("Loaded CSV Data:", tapirs);
        console.table(tapirs);

        // Ensure hour values are correctly parsed as numbers
        tapirs.forEach(d => {
            d.hour = +d.hour; // Ensure hour is a number
            d.count = +d.count; // Ensure count is a number
        });

        // Group data by 'individual_name'
        const groupedTapirs = d3.group(tapirs, d => d.individual_name);
        console.log("Grouped Tapirs Data:", groupedTapirs);

        // Group data by biome
        const biomeGroups = {};
        
        // Initialize biome groups
        biomeOrder.forEach(biome => {
            biomeGroups[biome] = [];
        });
        
        // Populate biome groups
        Array.from(groupedTapirs.entries()).forEach(([individual, data]) => {
            const biome = data[0].Biome;
            if (biomeGroups[biome]) {
                biomeGroups[biome].push([individual, data]);
            }
        });
        
        console.log("Biome Groups:", biomeGroups);

        // Populate dropdowns based on biome
        // First add "None" options to each dropdown
        atlanticForestDropdown.append("option")
            .attr("value", "none")
            .text("None");
            
        pantanalDropdown.append("option")
            .attr("value", "none")
            .text("None");
            
        cerradoDropdown.append("option")
            .attr("value", "none")
            .text("None");
        
        // Add individuals to their respective biome dropdowns
        for (const [biome, individuals] of Object.entries(biomeGroups)) {
            const dropdown = biome === "Atlantic Forest" ? atlanticForestDropdown :
                            biome === "Pantanal" ? pantanalDropdown :
                            biome === "Cerrado" ? cerradoDropdown : null;
            
            if (dropdown) {
                individuals.forEach(([individual, _]) => {
                    dropdown.append("option")
                        .attr("value", individual)
                        .text(individual);
                });
            }
        }

        // Function to update the plot based on selected individuals
        function updatePlot() {
            clearSVG();
            
            // Get selected values
            const atlanticForestSelection = atlanticForestDropdown.property("value");
            const pantanalSelection = pantanalDropdown.property("value");
            const cerradoSelection = cerradoDropdown.property("value");
            
            // Create a data array to store all selected individuals
            const selectedData = [];
            
            // Add selections to the data array if they are not "none"
            if (atlanticForestSelection !== "none") {
                const data = groupedTapirs.get(atlanticForestSelection);
                selectedData.push({
                    individual: atlanticForestSelection,
                    biome: "Atlantic Forest",
                    data: data.sort((a, b) => a.hour - b.hour)
                });
            }
            
            if (pantanalSelection !== "none") {
                const data = groupedTapirs.get(pantanalSelection);
                selectedData.push({
                    individual: pantanalSelection,
                    biome: "Pantanal",
                    data: data.sort((a, b) => a.hour - b.hour)
                });
            }
            
            if (cerradoSelection !== "none") {
                const data = groupedTapirs.get(cerradoSelection);
                selectedData.push({
                    individual: cerradoSelection,
                    biome: "Cerrado",
                    data: data.sort((a, b) => a.hour - b.hour)
                });
            }
            
            // If no individuals are selected, show message
            if (selectedData.length === 0) {
                svg.append("text")
                    .attr("x", 200)
                    .attr("y", 200)
                    .attr("text-anchor", "middle")
                    .text("Please select at least one individual");
                return;
            }
            
            // Log the data being plotted for debugging
            console.log("Plotting data for:", selectedData);

            // Draw the circular line plot with multiple individuals
            drawMultiCircularLinePlot(svg, selectedData);
        }
        
        // Add change event listeners to all dropdowns
        atlanticForestDropdown.on("change", updatePlot);
        pantanalDropdown.on("change", updatePlot);
        cerradoDropdown.on("change", updatePlot);
        
        // Initial plot
        updatePlot();
    })
    .catch(error => {
        console.error("Error loading CSV:", error);
    });

// Function to draw a circular line plot with multiple individuals
function drawMultiCircularLinePlot(svg, selectedData) {
    const width = 400, height = 400;
    const radius = Math.min(width, height) / 2 - 60; // Define radius for plot

    // Create a group (`g`) element and center it in the SVG
    const g = svg.append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // Angle scale for mapping hours to angles
    const angleScale = d3.scaleLinear()
        .domain([0, 24])
        .range([0, 2 * Math.PI]);
    
    // Add π/2 rotation to make 0 hour point to the top (12 o'clock)
    const adjustedAngle = hour => angleScale(hour) - Math.PI/2;

    // Find maximum count across all selected individuals
    const maxCount = d3.max(selectedData, item => 
        d3.max(item.data, d => d.count)
    );

    // Scale for mapping count values to radial distance
    const radiusScale = d3.scaleLinear()
        .domain([0, maxCount])
        .range([0, radius]);

    // Draw the outer boundary circle
    g.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", radius)
        .attr("fill", "none")
        .attr("stroke", "#ccc")
        .attr("stroke-width", 1.5);

    // Draw circular gridlines
    const gridStep = maxCount / 5;
    
    for (let i = gridStep; i <= maxCount; i += gridStep) {
        g.append("circle")
            .attr("class", "circular-grid-line")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", radiusScale(i))
            .attr("fill", "none")
            .attr("stroke", "#ccc")
            .attr("stroke-width", 0.5)
            .attr("stroke-dasharray", "2, 2");
            
        // Add scale labels
        g.append("text")
            .attr("class", "scale-label")
            .attr("x", 0)
            .attr("y", -radiusScale(i))
            .attr("dy", "3px")
            .attr("text-anchor", "middle")
            .text(Math.round(i));
    }

    // Draw radial gridlines (every 3 hours)
    g.selectAll(".radial-grid-line")
        .data(d3.range(0, 24, 3))
        .enter().append("line")
        .attr("class", "radial-grid-line")
        .attr("stroke", "#ccc")
        .attr("stroke-width", 0.5)
        .attr("stroke-dasharray", "2, 2")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", d => radius * Math.cos(adjustedAngle(d)))
        .attr("y2", d => radius * Math.sin(adjustedAngle(d)));

    // Draw a line for each selected individual with hoverable segments
    selectedData.forEach(item => {
        const fillColor = biomeColors[item.biome];
        
        // Create line points for this individual
        const linePoints = item.data.map(d => {
            const angle = adjustedAngle(d.hour);
            const r = radiusScale(d.count);
            return [r * Math.cos(angle), r * Math.sin(angle)];
        });
        
        // Close the path by adding the first point at the end
        if (linePoints.length > 0) {
            linePoints.push(linePoints[0]);
        }
        
        // Create a line generator
        const lineGenerator = d3.line();
        
        // Draw the filled area
        g.append("path")
            .attr("class", `radar-area-${item.individual.replace(/\s+/g, '-')}`)
            .attr("d", lineGenerator(linePoints))
            .attr("fill", fillColor)
            .attr("fill-opacity", 0.2)
            .attr("stroke", "none");
        
        // Create invisible wider stroke lines for better hover detection
        g.append("path")
            .attr("class", `radar-hover-${item.individual.replace(/\s+/g, '-')}`)
            .attr("d", lineGenerator(linePoints))
            .attr("fill", "none")
            .attr("stroke", "transparent")
            .attr("stroke-width", 15) // Wide invisible stroke for easier hovering
            .style("pointer-events", "stroke") // Only trigger events on the stroke
            .on("mouseover", function() {
                // Highlight the actual line on hover
                d3.select(`.radar-line-${item.individual.replace(/\s+/g, '-')}`)
                    .attr("stroke-width", 4);
                
                // Show the tooltip
                d3.select(".tooltip")
                    .style("visibility", "visible")
                    .html(`<strong>${item.individual}</strong><br>Biome: ${item.biome}`);
            })
            .on("mousemove", function(event) {
                // Get mouse coordinates relative to the SVG
                const [mouseX, mouseY] = d3.pointer(event, svg.node());
                
                // Calculate distance from center
                const centerX = width / 2;
                const centerY = height / 2;
                const dx = mouseX - centerX;
                const dy = mouseY - centerY;
                
                // Convert to polar coordinates
                const angle = Math.atan2(dy, dx);
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Convert angle to hour (add π/2 to adjust back from our rotation)
                let hour = (angle + Math.PI/2) / (2 * Math.PI) * 24;
                // Make sure hour is between 0 and 24
                hour = (hour + 24) % 24;
                
                // Find the closest data point
                const sortedData = [...item.data].sort((a, b) => 
                    Math.abs(a.hour - hour) - Math.abs(b.hour - hour)
                );
                const closestPoint = sortedData[0];
                
                // Update tooltip with the closest point's information
                d3.select(".tooltip")
                    .html(`<strong>${item.individual}</strong> (${item.biome})<br>` +
                         `Hour: ${Math.round(closestPoint.hour)}:00<br>` +
                         `Count: ${closestPoint.count.toFixed(1)}`);
                
                // Position the tooltip near the mouse
                d3.select(".tooltip")
                    .style("top", `${event.pageY - 30}px`)
                    .style("left", `${event.pageX + 10}px`);
            })
            .on("mouseout", function() {
                // Return the line to normal
                d3.select(`.radar-line-${item.individual.replace(/\s+/g, '-')}`)
                    .attr("stroke-width", 2);
                
                // Hide the tooltip
                d3.select(".tooltip")
                    .style("visibility", "hidden");
            });
        
        // Draw the visible line (thinner than the hover area)
        g.append("path")
            .attr("class", `radar-line-${item.individual.replace(/\s+/g, '-')}`)
            .attr("d", lineGenerator(linePoints))
            .attr("fill", "none")
            .attr("stroke", fillColor)
            .attr("stroke-width", 2);
    });

    // Define time labels to replace specific hour labels
    const timeLabels = [
        { hour: 0, label: "Midnight" },
        { hour: 6, label: "Dawn" },
        { hour: 12, label: "Noon" },
        { hour: 18, label: "Dusk" }
    ];

    // Map of hours to their labels
    const hourToLabel = {};
    timeLabels.forEach(item => {
        hourToLabel[item.hour] = item.label;
    });

    // Add hour labels around the radial plot
    g.selectAll(".hour-label")
        .data(d3.range(0, 24, 3))
        .enter().append("text")
        .attr("class", "hour-label")
        .attr("x", d => (radius + 25) * Math.cos(adjustedAngle(d)))
        .attr("y", d => (radius + 20) * Math.sin(adjustedAngle(d)))
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .text(d => hourToLabel[d] || `${d}:00`); // Use time label if available, otherwise use hour number
        
    // Add tooltip container if it doesn't exist
    const tooltip = d3.select("body").select(".tooltip");
    if (tooltip.empty()) {
        d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "rgba(255, 255, 255, 0.9)")
            .style("padding", "5px")
            .style("border", "1px solid #ccc")
            .style("border-radius", "4px")
            .style("pointer-events", "none")
            .style("visibility", "hidden");
    }
}
// Select all videos in the document
// const videos = document.querySelectorAll('.video-player');

// function playAllVideos() {
 //    videos.forEach(video => video.play());
// }


document.querySelectorAll('.video-container').forEach(container => {
    container.addEventListener('mouseenter', playAllVideos);
    // container.addEventListener('mouseleave', pauseAllVideos);
});


/* ============================= */
/* ====== ADD MAPBOX CODE ====== */
/* ============================= */

import "https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.js";



// Initialize Mapbox map
const map = new mapboxgl.Map({
    container: 'map', // ID of the div where the map will be displayed
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [-55, -22], // Adjust to match Tapir locations
    zoom: 6
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
d3.csv('data/df_merged_na_coord.csv', d3.autoType).then(data => {
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

    // Convert data into GeoJSON format
    const geojsonData = {
        type: "FeatureCollection",
        features: []
    };

    groupedIndividuals.forEach((individualData, individual) => {
        // Sort each individual's data by timestamp
        individualData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        // Extract coordinates for movement tracking
        const coordinates = individualData.map(d => [d.Longitude, d.Latitude]);

        if (coordinates.length > 1) {
            movementTracks.push({
                type: "Feature",
                properties: { individual, color: getColorForID(individual) },
                geometry: {
                    type: "LineString",
                    coordinates
                }
            });
        }

        // Add points to GeoJSON features
        individualData.forEach(d => {
            geojsonData.features.push({
                type: "Feature",
                properties: {
                    ID: d.ID,
                    timestamp: d.timestamp,
                    individual: d["individual_local_identifier"]
                },
                geometry: {
                    type: "Point",
                    coordinates: [d.Longitude, d.Latitude]
                }
            });
        });
    });

    // Add source for individual points
    map.addSource("tapirs", {
        type: "geojson",
        data: geojsonData,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
    });

    // Add clustered points layer
    map.addLayer({
        id: "clusters",
        type: "circle",
        source: "tapirs",
        filter: ["has", "point_count"],
        paint: {
            "circle-color": ["step", ["get", "point_count"], "#51bbd6", 10, "#f1f075", 50, "#f28cb1"],
            "circle-radius": ["step", ["get", "point_count"], 15, 10, 20, 50, 30]
        }
    });

    // Add cluster count labels
    map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "tapirs",
        filter: ["has", "point_count"],
        layout: {
            "text-field": ["get", "point_count"],
            "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
            "text-size": 14
        }
    });

    // Add individual (non-clustered) points
    map.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "tapirs",
        filter: ["!", ["has", "point_count"]],
        paint: {
            "circle-color": "#ff5733", // Default color for points
            "circle-radius": 5,
            "circle-stroke-width": 1,
            "circle-stroke-color": "#fff"
        }
    });

    // Add popups on click
    map.on("click", "unclustered-point", e => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        const { ID, timestamp, individual } = e.features[0].properties;

        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(`
                <strong>ID:</strong> ${ID}<br>
                <strong>Timestamp:</strong> ${timestamp}<br>
                <strong>Individual:</strong> ${individual}
            `)
            .addTo(map);
    });

    // Zoom into cluster when clicked
    map.on("click", "clusters", e => {
        const features = map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
        const clusterId = features[0].properties.cluster_id;

        map.getSource("tapirs").getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err) return;

            map.easeTo({
                center: features[0].geometry.coordinates,
                zoom
            });
        });
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

        movementTracks.forEach(track => {
            map.addLayer({
                id: `movement-line-${track.properties.individual}`,
                type: "line",
                source: "movement-tracks",
                filter: ["==", ["get", "individual"], track.properties.individual],
                paint: {
                    "line-color": track.properties.color,
                    "line-width": 2,
                    "line-opacity": 0.8
                }
            });
        });
    }

}).catch(error => {
    console.error("❌ Error loading CSV:", error);
});