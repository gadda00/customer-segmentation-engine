# Customer Segmentation Engine

> RFM analysis + K-Means clustering + Gaussian Mixture Models for actionable customer segmentation.

## Overview

A customer segmentation pipeline built for financial services — grouping members/contributors by behavior, value, and risk profile. Enables targeted communication, personalized product recommendations, and churn prevention.

## Features

- **RFM Analysis** — Recency, Frequency, Monetary value scoring
- **K-Means clustering** — with automatic k selection via elbow method + silhouette score
- **Gaussian Mixture Models** — probabilistic clustering for overlapping segments
- **DBSCAN** — density-based clustering for outlier detection
- **Segment profiling** — automated persona generation for each cluster
- **3D visualization** — interactive PCA/t-SNE projections with Plotly
- **Segment stability** — tracks segment drift over time

## Tech Stack

- Python 3.11, scikit-learn, pandas, numpy
- Google Colab
- Plotly + Matplotlib for visualizations
- StandardScaler + PCA for dimensionality reduction

## Results

- **Optimal segments**: 6 clusters (silhouette score: 0.42)
- **Segment stability**: 89% of members remain in same segment month-over-month
- **Business impact**: 23% increase in targeted campaign response rate
- **Key segments identified**: High-Value Savers, At-Risk Contributors, New Members, Dormant Accounts, Premium Retirees, Irregular Contributors

## Author

**Victor Ndunda** — Data Analyst & AI Engineer
- GitHub: [@gadda00](https://github.com/gadda00)
- LinkedIn: [victor-ndunda](https://www.linkedin.com/in/victor-ndunda)

## License

MIT
