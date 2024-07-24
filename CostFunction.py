import numpy as np
matplotlib widget
import matplotlib.pyplot as plt
from lab_utils_uni import plt_intuition, plt_stationary, plt_update_onclick, soup_bowl

x_train = np.array([1.0, 1.7, 2.0, 2.5, 3.0, 3.2])
y_train = np.array([250, 300, 480,  430,   630, 730,])


def compute_cost(w,b,x,y):
    m= x.shape[0]
    
    cost_sum = 0
    
    for i in range(m):
        cost_sum += (w * x[i] + b - y[i])**2
    
    total_cost = (1/(2*m) )* cost_sum
    
    return total_cost

plt.close('all')
fig, ax, dyn_items = plt_stationary(x_train, y_train)

updater = plt_update_onclick(fig, ax, dyn_items, x_train, y_train, dyn_items)