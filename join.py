#%%
import pandas as pd

#%%
coor = pd.read_csv('data/df_merged_na_coord2.csv')
print(coor)

# %%
ind = pd.read_csv('data/results_distance_join.csv')
print(ind.head())

# %%
#left join ind to coor based on individual_local_identifier. Select only age and sex from ind.
coors = coor.merge(ind[['individual_name', 'sex', 'age',]], on='individual_name', how='left')
print(coors)
# %%
#drop duplicates
coors = coors.drop_duplicates()
print(coors)

#%%
# rename the names in Biome column of 'Atlantic' to 'Atlantic Forest'
coors['Biome'] = coors['Biome'].replace('Atlantic', 'Atlantic Forest')


# %%
#save to csv

coors.to_csv('data/df_merged_na_coord3.csv', index=False)
# %%
