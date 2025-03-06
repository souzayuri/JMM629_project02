import pandas as pd


#%% Load the dataset
df = pd.read_csv("data/df_combined.csv").dropna(subset=['timestamp'])
df


#%% Convert timestamp to datetime format and extract the hour
df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')
df['hour'] = df['timestamp'].dt.hour

#%% Count the number of activities per hour for each individual and biome
activity_count_per_hour_biome = df.groupby(['individual.local.identifier', 'Biome', 'hour']) \
    .size() \
    .reset_index(name='activity_count')

#%% Calculate the average activity count per hour for each individual and biome
# Extract the date part only
df['date'] = df['timestamp'].dt.date

avg_activity_per_hour_biome = df.groupby(['individual.local.identifier', 'Biome', 'hour']) \
    .size() \
    .groupby(['individual.local.identifier', 'Biome', 'hour']) \
    .mean() \
    .reset_index(name='average_activity_count')

avg_activity_per_hour_biome

# %% Merge the count and average data
activity_summary = activity_count_per_hour_biome.merge(avg_activity_per_hour_biome, 
                                                       on=['individual.local.identifier', 'Biome'])

activity_summary.rename(columns={"individual.local.identifier": "individual_local_identifier"}, inplace=True)

# Extracting the individual names after the last "_"
activity_summary["individual_name"] = activity_summary["individual_local_identifier"].str.split("_").str[-1]

activity_summary.rename(columns={"average_activity_count": "average"}, inplace=True)
activity_summary.rename(columns={"activity_count": "count"}, inplace=True)
activity_summary
#activity_summary.to_csv("data/activity_summary.csv", index=False)
# %%


# Load the dataset from the uploaded CSV file
data = pd.read_csv("data/df_combined.csv")

# Convert timestamp to datetime format
data['timestamp'] = pd.to_datetime(data['timestamp'], errors='coerce')

# Extract the hour from the timestamp
data['hour'] = data['timestamp'].dt.hour

# Count occurrences per hour for each individual
activity_per_hour = data.groupby(['individual.local.identifier', 'hour']).size().reset_index(name='activity_count')
activity_per_hour


# Compute the average activity per hour
average_activity = data.groupby('individual.local.identifier', 'hour')['activity_count'].mean().reset_index()
average_activity
# %%

# Load the dataset from the uploaded CSV file
data = pd.read_csv("data/df_combined.csv")

# Convert timestamp to datetime format
data['timestamp'] = pd.to_datetime(data['timestamp'], errors='coerce')

# Extract the hour from the timestamp
data['hour'] = data['timestamp'].dt.hour

# Count occurrences per hour
hourly_counts = data.groupby(['individual.local.identifier', 'Biome','hour']).size().reset_index(name='total_count')

# Count how many unique days each hour appears in
data['date'] = data['timestamp'].dt.date  # Extract date component
hourly_days_count = data.groupby(['individual.local.identifier', 'Biome','hour'])['date'].nunique().reset_index(name='unique_days')

# Compute the average count per hour across different days
hourly_counts = hourly_counts.merge(hourly_days_count, on=['individual.local.identifier', 'Biome','hour'])
hourly_counts['average_count_per_hour'] = hourly_counts['total_count'] / hourly_counts['unique_days']

hourly_counts.rename(columns={"individual.local.identifier": "individual_local_identifier"}, inplace=True)

# Extracting the individual names after the last "_"
hourly_counts["individual_name"] = hourly_counts["individual_local_identifier"].str.split("_").str[-1]

hourly_counts.rename(columns={"average_count_per_hour": "average"}, inplace=True)
hourly_counts.rename(columns={"total_count": "count"}, inplace=True)
hourly_counts

#hourly_counts.to_csv("data/activity_summary2.csv", index=False)

# %%
