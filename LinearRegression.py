import math, copy
import nympy as np
import matplotlib.pyplot as plt
from lab_utilits_uni import plt_house_x, plt_contour_wgrad, plt_divergence, plt_gradients

x_train = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
y_train = np.array([289.0, 540.0, 860.0, 1364.0, 1659.0])

def compute_cost(x,y,w,b):
    m = x.shape[0]
    cost = 0
    
    for i in range(m):
        cost += (w*x[i]+b-y[i])**2
    return 1/(2*m)*cost

def compute_gradient(x,y,w,b):
    m  = x.shape[0]
    
    