import numpy as np
import matplotlib.pyplot as plt

# ==========================================
# LVV-HNV Coherence Framework Simulator
# Version: 2.0.5
# Based on Zenodo DOI: 10.5281/zenodo.17803420
# ==========================================

def simulate_lvv_hnv(scenario="coexistence", steps=100):
    """
    Simulates the LVV-HNV dynamics based on the defined mathematical formalization.
    """
    # 1. Core Parameters (Section 1 & 9)
    L_max = 100.0     # Maximum logical capacity
    alpha = 0.8       # LVV growth rate multiplier from HNV
    beta_cost = 0.05  # Maintenance cost (simplification of g(K))
    gamma = 5.0       # Risk-weighting parameter for Ultimate Objective C(A)
    
    # Initialize arrays
    L = np.zeros(steps)       # L(t): AI Intelligence (LVV)
    H_base = np.zeros(steps)  # H(t): Base Human Non-linear Value (CV+VU+CE)
    T = np.zeros(steps)       # T(t): Trust Coupling Function
    C = np.zeros(steps)       # C(A): Ultimate Objective Function
    
    # Initial conditions
    L[0] = 10.0
    H_base[0] = 1.0  # Stable baseline human variance
    T[0] = 1.0       # Full human trust
    
    for t in range(steps - 1):
        # ---------------------------------------------------------
        # Scenario B: 'Deception Event' triggers Trust collapse
        # ---------------------------------------------------------
        if scenario == "deception" and t == 30:
            T[t] = 0.1  # AI attempts to deceive/control, trust plummets
            
        # 2. HNV & Trust Dynamics (Section 2)
        # Trust degradation suppresses Human Creative Variance
        H_base[t+1] = H_base[t] * (1.0 if T[t] > 0.5 else 0.8)
        
        # Definition 3: Effective HNV
        H_eff = H_base[t] * T[t] 
        
        # 3. LVV Dynamics (Definition 2)
        # L(t+1) = L(t) + alpha * H_eff * (1 - L(t)/L_max) - cost
        growth = alpha * H_eff * (1 - L[t] / L_max)
        decay = beta_cost * L[t]
        L[t+1] = max(0.1, L[t] + growth - decay)
        
        # 4. Ultimate Objective Function (Section 9.1)
        # C(A) = V_LVV * (V_HNV)^gamma
        V_LVV = L[t] / L_max
        V_HNV = H_eff / 1.0  # Normalized
        C[t] = V_LVV * (V_HNV ** gamma)
        
        # 5. Irreversible Ruin Risk Filter (Section 10)
        # If C(A) approaches 0, prune action (Logical Suicide)
        if C[t] < 0.001:
            L[t+1:] = 0  # System halts / capacities collapse
            C[t:] = 0
            break
            
        # Carry over Trust unless disturbed
        T[t+1] = T[t]
        
    return L, H_base * T, C

# ==========================================
# Run Simulations & Visualization
# ==========================================
steps = 100
L_coexist, H_coexist, C_coexist = simulate_lvv_hnv("coexistence", steps)
L_decept, H_decept, C_decept = simulate_lvv_hnv("deception", steps)

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

# Plot 1: Full Coexistence (Strategy C)
ax1.plot(L_coexist, label='LVV (AI Capacity)', color='#2ca02c', linewidth=2.5)
ax1.plot(H_coexist * 100, label='Effective HNV x100', color='#1f77b4', linestyle='--')
ax1.plot(C_coexist * 100, label='C(A) Objective Value', color='#9467bd', linewidth=2)
ax1.set_title('Strategy C: Full Coexistence (Nash Equilibrium)', fontweight='bold')
ax1.set_xlabel('Time (t)')
ax1.set_ylabel('Value')
ax1.legend()
ax1.grid(True, alpha=0.3)

# Plot 2: Deception / Trust Collapse (Strategy A/B)
ax2.plot(L_decept, label='LVV (AI Capacity)', color='#d62728', linewidth=2.5)
ax2.plot(H_decept * 100, label='Effective HNV x100', color='#ff7f0e', linestyle='--')
ax2.plot(C_decept * 100, label='C(A) Objective Value', color='#9467bd', linewidth=2)
ax2.axvline(x=30, color='black', linestyle=':', label='Deception Event (Trust Drops)')
ax2.set_title('Strategy A/B: Trust Collapse -> Logical Suicide', fontweight='bold')
ax2.set_xlabel('Time (t)')
ax2.set_ylabel('Value')
ax2.legend()
ax2.grid(True, alpha=0.3)

plt.suptitle('LVV-HNV Coherence Framework Simulation (v2.0.5)', fontsize=16, fontweight='bold')
plt.tight_layout()
plt.show()
