#%%
import os

#%%
import pandas as pd

#%%
atlc = pd.read_csv("data/atlantica.csv")
atlc["Altitude"] = pd.NA
atlc["Speed"] = pd.NA
atlc["Biome"] = "Atlantic Forest"
atlc
print(atlc.info())

#%%
cerr = pd.read_csv("data/cerrado.csv")
cerr["Biome"] = "Cerrado"
cerr
print(cerr.info())

#%%
pant = pd.read_csv("data/pantanal.csv")
pant["Biome"] = "Pantanal"
pant
print(pant.info())

#%%
sex = pd.read_csv("data/sex.csv")
sex
print(sex.info())


# %%
df_combined = pd.concat([atlc, cerr, pant], ignore_index=True)
df_combined
print(df_combined.info())

# %% - DF Merged
df_merged = df_combined.merge(sex, on='individual.local.identifier', how='left')
df_merged
print(df_merged.info())

# %%
print(df_merged['sex'].value_counts())

# %%
print(df_merged['age'].value_counts())

# %%
print(df_merged['age'].isna().any())

# %%
print(df_merged['age'].isna().sum())

# %%
print(df_merged['Speed'].isna().sum())

# %%
print(df_merged['Altitude'].isna().sum())

#%%
import seaborn as sns
import matplotlib.pyplot as plt
import numpy as np

# %%
df_merged_na = df_merged.dropna(subset=['Altitude','Speed'])
print(df_merged_na)
df_merged_na
#df_merged_na.iloc[:, [0, 1, 2, 3, 4, 7]].to_csv("data/df_merged_na_coord.csv", index=False)

#%%
print(df_merged_na['Speed'].isna().sum())

#%%
plt.figure(figsize=(8, 6))

biomes_color = {'Pantanal': 'blue',
                'Cerrado': 'red'}

sns.regplot(df_merged_na, 
            x = 'Altitude', 
            y = 'Speed', 
            scatter = False,
            line_kws = {'color': 'black'})

sns.scatterplot(df_merged_na, 
            x = 'Altitude', 
            y = 'Speed',
            hue = 'Biome',
            palette = biomes_color,
            s = 100,
            alpha = 0.5,
            edgecolor = 'black')


plt.xscale('log')
#plt.yscale('log')

plt.show()


#%%

df_merged['timestamp'] = pd.to_datetime(df_merged['timestamp'], format = "%m/%d/%Y %H:%M")
df_merged["hour"] = df_merged["timestamp"].dt.hour

df_merged

# %%
# Count the number of observations per hour
biome_hourly_counts = df_merged.groupby(["hour", "Biome"]).size().reset_index(name="count")
biome_hourly_counts


#%% Convert hour to radians (0 to 2π)

biome_hourly_counts["hour"] = biome_hourly_counts["hour"].astype(int)
biome_hourly_counts

biome_hourly_counts["radian"] = biome_hourly_counts["hour"] * (2 * np.pi / 24)
biome_hourly_counts

biome_hourly_counts["hour"].unique()

#biome_hourly_counts.to_csv("data/biome_hourly_counts.csv", index=False)

#%% Create polar plot

fig, ax = plt.subplots(figsize=(8, 8), subplot_kw={'projection': 'polar'})
fig

colors = {"Atlantic Forest": "blue", "Cerrado": "purple", "Pantanal": "orange"}


for biome, group in biome_hourly_counts.groupby("Biome"):
    # Sort values to ensure they are in order
    group = group.sort_values("hour")
    
    # Convert count to log scale (handling zeros)
    log_count = np.log10(group["count"].replace(0, 1))  # Avoid log(0) error
    #log_count = group["count"]
    
    # Ensure the last hour (23) connects to the first hour (0)
    group_closed = pd.concat([group, group.iloc[[0]]], ignore_index=True)  # Fix: Use concat
    log_count_closed = np.append(log_count, log_count.iloc[0])  # Append first log value

    ax.plot(group_closed["radian"], log_count_closed, label=biome, color=colors[biome])
    ax.fill(group_closed["radian"], log_count_closed, alpha=0.3, color=colors[biome])  # Optional fill



ax.set_theta_zero_location("N")  # Start at the top
ax.set_theta_direction(-1)  # Clockwise
ax.set_xticks(np.linspace(0, 2*np.pi, 24, endpoint=False))
ax.set_xticklabels(range(24))  # Display hours

plt.legend()
plt.title("Counts per Hour in a Circular Plot")
plt.show()



# %%
biome_hourly_counts.to_csv("data/biome_hourly_counts.csv", index=False)


# %%
# Count the number of observations per hour
sex_hourly_counts = df_merged.groupby(["hour", "sex"]).size().reset_index(name="count")
sex_hourly_counts


#%% Convert hour to radians (0 to 2π)

sex_hourly_counts["hour"] = sex_hourly_counts["hour"].astype(int)
sex_hourly_counts

sex_hourly_counts["radian"] = sex_hourly_counts["hour"] * (2 * np.pi / 24)
sex_hourly_counts

sex_hourly_counts["hour"].unique()

#biome_hourly_counts.to_csv("data/biome_hourly_counts.csv", index=False)

#%% Create polar plot

fig, ax = plt.subplots(figsize=(8, 8), subplot_kw={'projection': 'polar'})
fig

colors = {"FEMALE": "purple", "MALE": "orange"}


for sex, group in sex_hourly_counts.groupby("sex"):
    # Sort values to ensure they are in order
    group = group.sort_values("hour")
    
    # Convert count to log scale (handling zeros)
    #log_count = np.log10(group["count"].replace(0, 1))  # Avoid log(0) error
    log_count = group["count"]
    
    # Ensure the last hour (23) connects to the first hour (0)
    group_closed = pd.concat([group, group.iloc[[0]]], ignore_index=True)  # Fix: Use concat
    log_count_closed = np.append(log_count, log_count.iloc[0])  # Append first log value

    ax.plot(group_closed["radian"], log_count_closed, label=sex, color=colors[sex])
    ax.fill(group_closed["radian"], log_count_closed, alpha=0.3, color=colors[sex])  # Optional fill



ax.set_theta_zero_location("N")  # Start at the top
ax.set_theta_direction(-1)  # Clockwise
ax.set_xticks(np.linspace(0, 2*np.pi, 24, endpoint=False))
ax.set_xticklabels(range(24))  # Display hours

plt.legend()
plt.title("Counts per Hour in a Circular Plot")
plt.show()


# %%
#sex_hourly_counts.to_csv("data/sex_hourly_counts.csv", index=False)


# %%

ind_hourly_counts = df_merged.groupby(["hour", "Biome", "individual.local.identifier"]).size().reset_index(name="count")
ind_hourly_counts

#%% Convert hour to radians (0 to 2π)
ind_hourly_counts["hour"] = ind_hourly_counts["hour"].astype(int)
ind_hourly_counts

ind_hourly_counts["radian"] = ind_hourly_counts["hour"] * (2 * np.pi / 24)
ind_hourly_counts

#ind_hourly_counts = ind_hourly_counts[ind_hourly_counts["Biome"] == "Atlantic"]

#ind_hourly_counts["hour"].unique()

ind_hourly_counts.rename(columns={"individual.local.identifier": "individual_local_identifier"}, inplace=True)

# Extracting the individual names after the last "_"
ind_hourly_counts["individual_name"] = ind_hourly_counts["individual_local_identifier"].str.split("_").str[-1]

#ind_hourly_counts.to_csv("data/ind_hourly_counts.csv", index=False)


# %%
import math  # For ceiling function

#%%
# Number of unique individuals
n_individuals = len(ind_hourly_counts["individual_local_identifier"].unique())

# Define number of columns per row
ncols = 5
nrows = math.ceil(n_individuals / ncols)  # Calculate required rows

# Create subplots with polar projections
fig, axes = plt.subplots(nrows=nrows, ncols=ncols, figsize=(ncols * 5, nrows * 5), 
                          subplot_kw={'projection': 'polar'})

# Flatten axes for easy iteration (in case of multiple rows)
axes = np.array(axes).flatten()

# Loop over individuals and plot
for ax, (ind, group) in zip(axes, ind_hourly_counts.groupby("individual_local_identifier")):
    group = group.sort_values("hour")

    # Use raw count values (or log scale if needed)
    log_count = group["count"]

    # Ensure the last hour (23) connects to the first hour (0)
    group_closed = pd.concat([group, group.iloc[[0]]], ignore_index=True)
    log_count_closed = np.append(log_count, log_count.iloc[0])  

    ax.plot(group_closed["radian"], log_count_closed, label=ind)
    ax.fill(group_closed["radian"], log_count_closed, alpha=0.3)  

    # Formatting
    ax.set_theta_zero_location("N")  
    ax.set_theta_direction(-1)  
    ax.set_xticks(np.linspace(0, 2 * np.pi, 24, endpoint=False))
    ax.set_xticklabels(range(24))
    ax.set_title(ind, fontsize=10)

# Hide unused subplots (if any)
for ax in axes[n_individuals:]:
    ax.set_visible(False)

plt.suptitle("Counts per Hour in a Circular Plot", fontsize=14)
plt.tight_layout()
plt.show()

# %%
