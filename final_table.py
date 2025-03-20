#%%
import pandas as pd
import numpy as np
from geopy.distance import geodesic
from datetime import datetime

#%% Load the dataset
df = pd.read_csv("data/df_combined.csv").dropna(subset=['timestamp'])
df

df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')
df['hour'] = df['timestamp'].dt.hour

df = df[['ID', 'timestamp', 'Longitude', 'Latitude', 'individual.local.identifier', 'Biome', 'sex', 'age', 'hour']]
print(df)

#%% 
# Ensure timestamp is in datetime format
df['timestamp'] = pd.to_datetime(df['timestamp'])

#%% 
# Function to calculate distance between two coordinates in meters
def calculate_distance(lat1, lon1, lat2, lon2):
    return geodesic((lat1, lon1), (lat2, lon2)).meters


#%% 
# Create a results dataframe to store distances
results = []

#%% 
# Group by individual and hour
grouped = df.sort_values(['individual.local.identifier', 'timestamp']).groupby(['individual.local.identifier', 
                                                                                'hour'])


#%% 
# Process each group
for group_key, group in grouped:
    # Unpack the group key correctly
    individual, hour = group_key
    
    # Sort by timestamp
    group = group.sort_values('timestamp')
    
    # Skip groups with only one point (can't calculate distance)
    if len(group) <= 1:
        results.append({
            'individual_local_identifier': individual,
            'hour': hour,
            'distance_meters': 0,
            'distance_km': 0,
            'num_points': len(group),
            'distance_per_point_meters': 0,  # Ratio of distance (meters) to number of points
            'distance_per_point_km': 0  # Ratio of distance (km) to number of points
        })
        continue
    
    # Initialize variables
    total_distance_meters = 0
    
    # Calculate distance between consecutive points
    for i in range(len(group) - 1):
        lat1, lon1 = group.iloc[i]['Latitude'], group.iloc[i]['Longitude']
        lat2, lon2 = group.iloc[i+1]['Latitude'], group.iloc[i+1]['Longitude']
        
        # Skip invalid coordinates
        if pd.isna(lat1) or pd.isna(lon1) or pd.isna(lat2) or pd.isna(lon2):
            continue
            
        # Calculate distance in meters
        distance = calculate_distance(lat1, lon1, lat2, lon2)
        total_distance_meters += distance
    
    # Calculate distance per point (ratio) in both meters and kilometers
    distance_per_point_meters = round(total_distance_meters / len(group), 2) if len(group) > 0 else 0
    distance_per_point_km = round((total_distance_meters / 1000) / len(group), 2) if len(group) > 0 else 0
    
    # Store results
    results.append({
        'individual_local_identifier': individual,
        'hour': hour,
        'distance_meters': round(total_distance_meters, 2),
        'distance_km': round(total_distance_meters / 1000, 2),  # Convert to kilometers
        'num_points': len(group),
        'distance_per_point_meters': distance_per_point_meters,  # Ratio of distance (meters) to number of points
        'distance_per_point_km': distance_per_point_km  # Ratio of distance (km) to number of points
    })

    
#%% 
# Convert results to DataFrame
results_df = pd.DataFrame(results)


#%%
# Extracting the individual names after the last "_"
results_df["individual_name"] = results_df["individual_local_identifier"].str.split("_").str[-1]


#%%
#count data
count = pd.read_csv("data/activity_summary2.csv")

# hour as integer
count['hour'] = count['hour'].astype(int)

count = count[['individual_local_identifier', 'hour', 'count']]

#%%
# join

df.rename(columns={"individual.local.identifier": "individual_local_identifier"}, inplace=True)
df = df[['individual_local_identifier', 'Biome', 'sex', 'age']]
df = df.drop_duplicates()

#left join

results_df_join = pd.merge(results_df, df, on='individual_local_identifier', how='left')
results_df_join

results_df_join_count = pd.merge(results_df_join, count, on=['individual_local_identifier','hour'], how='left')
results_df_join_count


#%%
# Save the results
#results_df_join_count.to_csv("data/results_distance_join.csv", index=False)

# %%

#%%
# load coor data

coor = pd.read_csv("data/df_merged_na_coord.csv")
coor

#%%
# Extracting the individual names after the last "_"
coor["individual_name"] = coor["individual_local_identifier"].str.split("_").str[-1]
coor

# %%
## export

coor.to_csv("data/df_merged_na_coord2.csv", index=False)
# %%
