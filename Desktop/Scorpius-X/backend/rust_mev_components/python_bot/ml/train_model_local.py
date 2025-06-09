
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import make_classification
from joblib import dump
import os

# Generate synthetic dataset
X, y = make_classification(
    n_samples=500,
    n_features=3,
    n_informative=3,
    n_redundant=0,
    random_state=42
)

# Train the model
clf = RandomForestClassifier(n_estimators=10, random_state=42)
clf.fit(X, y)

# Save the model in the current environment (to ensure compatibility)
output_path = "model_161.joblib"
dump(clf, output_path)
print(f"✅ Model saved as {output_path}")
