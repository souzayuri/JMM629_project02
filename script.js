// Import the D3.js library from the specified CDN
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

console.log(d3); // Check if D3 is loaded

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

// Create dropdown container
const dropdownContainer = container.append("div")
    .attr("class", "dropdown-container");

// Add label for dropdown
dropdownContainer.append("label")
    .attr("for", "individual-select")
    .text("Select Individual: ");

// Create the dropdown element
const dropdown = dropdownContainer.append("select")
    .attr("id", "individual-select");

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

        // Group data by 'individual_name'
        const groupedTapirs = d3.group(tapirs, d => d.individual_name);
        console.log("Grouped Tapirs Data:", groupedTapirs);

        // Convert grouped data into an array and sort based on predefined biome order
        const sortedTapirs = Array.from(groupedTapirs.entries()).sort((a, b) => {
            const biomeA = a[1][0].Biome;
            const biomeB = b[1][0].Biome;
            return biomeOrder.indexOf(biomeA) - biomeOrder.indexOf(biomeB);
        });

        // Populate dropdown with individual names
        // First add an "All Individuals" option
        dropdown.append("option")
            .attr("value", "all")
            .text("All Individuals (Average)");
            
        // Then add all individual tapirs
        sortedTapirs.forEach(([individual, data]) => {
            dropdown.append("option")
                .attr("value", individual)
                .text(`${individual} (${data[0].Biome})`);
        });

        // Function to calculate average data for all individuals
        function calculateAverageData() {
            // Get all hours
            const hours = d3.range(0, 24);
            
            // Create an object to store total counts and number of individuals for each hour
            const hourlyTotals = {};
            hours.forEach(hour => {
                hourlyTotals[hour] = { total: 0, count: 0 };
            });
            
            // Sum up all counts for each hour
            tapirs.forEach(d => {
                hourlyTotals[d.hour].total += d.count;
                hourlyTotals[d.hour].count += 1;
            });
            
            // Calculate average for each hour
            const averageData = hours.map(hour => ({
                hour: hour,
                count: hourlyTotals[hour].total / hourlyTotals[hour].count
            }));
            
            return averageData;
        }

        // Function to update the plot based on selected individual
        function updatePlot() {
            clearSVG();
            
            const selectedValue = dropdown.property("value");
            let plotData;
            let biome;
            let title;
            
            if (selectedValue === "all") {
                // Calculate and use average data
                plotData = calculateAverageData();
                title = "Average Activity Pattern (All Individuals)";
                // Use a neutral color for the average plot
                biome = "average";
            } else {
                // Get data for the selected individual
                const individualData = groupedTapirs.get(selectedValue);
                plotData = individualData.map(d => ({ hour: d.hour, count: d.count }));
                biome = individualData[0].Biome;
                title = `Activity Pattern: ${selectedValue} (${biome})`;
            }
            
            // Get the appropriate fill color
            const fillColor = selectedValue === "all" ? "#c73f9e" : biomeColors[biome] || "#c73f9e";
            
            // Add title to the chart
            // svg.append("text")
            //     .attr("class", "chart-title")
            //     .attr("x", 200)
            //     .attr("y", 20)
            //     .text(title);
                
            // Draw the polar plot
            drawPolarPlot(svg, plotData, fillColor);
        }
        
        // Add change event listener to dropdown
        dropdown.on("change", updatePlot);
        
        // Initial plot (default to "all")
        updatePlot();
    })
    .catch(error => {
        console.error("Error loading CSV:", error);
    });

// Function to draw a polar plot with bars inside a given SVG
function drawPolarPlot(svg, tapirs, fillColor) {
    const width = 400, height = 400;
    const radius = Math.min(width, height) / 2 - 60; // Define radius for plot

    // Create a group (`g`) element and center it in the SVG
    const g = svg.append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // Scale for mapping hours (0-24) to radians (0 to 2π)
    const angleScale = d3.scaleLinear()
        .domain([0, 24])
        .range([0, 2 * Math.PI]);

    // Scale for mapping count values to radial distance
    const radiusScale = d3.scaleLinear()
        .domain([0, d3.max(tapirs, d => d.count)])
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
    const maxCount = d3.max(tapirs, d => d.count);
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
        .attr("stroke-width", 1)
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", d => radius * Math.cos(angleScale(d) - Math.PI / 2))
        .attr("y2", d => radius * Math.sin(angleScale(d) - Math.PI / 2));

    // Calculate the angle width for each bar (with slight padding)
    const barPadding = 0.05; // Padding between bars in radians
    const barWidth = (2 * Math.PI / 24) - barPadding;

    // Create a container for the bars
    const barsGroup = g.append("g")
        .attr("class", "bars");

    // Add bars for each hour
    barsGroup.selectAll(".bar")
        .data(tapirs)
        .enter().append("path")
        .attr("class", "bar")
        .attr("fill", fillColor)
        .attr("stroke", d3.color(fillColor).darker(0.5))
        .attr("stroke-width", 1)
        .attr("fill-opacity", 0.7)
        .attr("d", d => {
            // Calculate the inner and outer radius and start/end angles
            const innerRadius = 0;
            const outerRadius = radiusScale(d.count);
            const startAngle = angleScale(d.hour) - barWidth/2 - Math.PI/2;
            const endAngle = angleScale(d.hour) + barWidth/2 - Math.PI/2;
            
            // Create an arc path
            const arc = d3.arc()
                .innerRadius(innerRadius)
                .outerRadius(outerRadius)
                .startAngle(startAngle)
                .endAngle(endAngle);
                
            return arc();
        })
        .on("mouseover", function(event, d) {
            d3.select(this)
                .attr("fill-opacity", 0.9)
                .attr("stroke-width", 2);
                
            d3.select(".tooltip")
                .style("visibility", "visible")
                .html(`Hour: ${d.hour}:00<br>Count: ${d.count.toFixed(1)}`);
        })
        .on("mousemove", function(event) {
            d3.select(".tooltip")
                .style("top", `${event.pageY - 30}px`)
                .style("left", `${event.pageX + 10}px`);
        })
        .on("mouseout", function() {
            d3.select(this)
                .attr("fill-opacity", 0.7)
                .attr("stroke-width", 1);
                
            d3.select(".tooltip")
                .style("visibility", "hidden");
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
        .attr("x", d => (radius + 25) * Math.cos(angleScale(d) - Math.PI / 2))
        .attr("y", d => (radius + 20) * Math.sin(angleScale(d) - Math.PI / 2))
        .attr("text-anchor", "middle")
        .text(d => hourToLabel[d] || d); // Use time label if available, otherwise use hour number

    // Add tooltip container if it doesn't exist
    const tooltip = d3.select("body").select(".tooltip");
    if (tooltip.empty()) {
        d3.select("body").append("div")
            .attr("class", "tooltip");
    }
}

// Select all videos in the document
const videos = document.querySelectorAll('.video-player');

function playAllVideos() {
    videos.forEach(video => video.play());
}

// function pauseAllVideos() {
//     videos.forEach(video => {
//         video.pause();
//         video.currentTime = 0; // Reset to start
//     });
// }

document.querySelectorAll('.video-container').forEach(container => {
    container.addEventListener('mouseenter', playAllVideos);
    // container.addEventListener('mouseleave', pauseAllVideos);
});

/* ============================= */
/* ====== ADD MAPBOX CODE ====== */
/* ============================= */

import "https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.js";

// Replace with your actual Mapbox Access Token
mapboxgl.accessToken = 'pk.eyJ1IjoieXVyaXNzb3V6YSIsImEiOiJjbTczZG9icHUwazR1MmpvNzg0ZWZ5MGM2In0._l-giDP6evfZgG3ZXTbD7g';

// Initialize Mapbox map
const map = new mapboxgl.Map({
    container: 'map', // ID of the div where the map will be displayed
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [-55, -22], // Adjust to match Tapir locations
    zoom: 5
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