# CICD-4 Installation Guide

![Architecture Diagram](./architecture-diagram.png)

Complete setup guide for Kubernetes-based CI/CD pipeline with monitoring and security tools.

## Prerequisites

- AWS CLI configured
- kubectl installed
- Docker installed
- Sufficient AWS permissions for EKS

## 1. EKS Cluster Setup

Create EKS cluster with managed node group:

```bash
eksctl create cluster --name wordtopdf \
  --nodegroup-name wordtopdf-nodes \
  --nodes 2 --nodes-min 2 --nodes-max 3 \
  --region ap-south-1 --managed \
  --node-type t3.medium
```

## 2. SonarQube Server

Run SonarQube server using Docker:

```bash
docker run -itd --name SonarQube-Server -p 9000:9000 sonarqube:lts-community
```

Access at: `http://localhost:9000` (admin/admin)

## 3. SonarQube Scanner

Install SonarQube scanner on Jenkins agent:

```bash
sudo apt update
sudo apt install curl -y
cd /opt
sudo curl -fL -o sonar-scanner.zip \
https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-5.0.1.3006-linux.zip
sudo unzip sonar-scanner.zip
sudo mv sonar-scanner-5.0.1.3006-linux sonar-scanner
sudo ln -s /opt/sonar-scanner/bin/sonar-scanner /usr/bin/sonar-scanner
```

## 4. Trivy Security Scanner

Install Trivy for container vulnerability scanning:

```bash
sudo apt-get update
sudo apt-get install -y wget apt-transport-https gnupg lsb-release

wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -
echo deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main \
 | sudo tee /etc/apt/sources.list.d/trivy.list

sudo apt-get update
sudo apt-get install -y trivy
trivy --version
```

## 5. ArgoCD GitOps

Install ArgoCD for continuous deployment:

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

Access ArgoCD UI:
```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

## 6. Helm Package Manager

Install Helm for Kubernetes package management:

```bash
curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-4
chmod 700 get_helm.sh
./get_helm.sh
```

## 7. Monitoring Stack (Grafana + Prometheus)

Install monitoring stack using Helm:

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm install monitoring prometheus-community/kube-prometheus-stack \
  -n monitoring --create-namespace
```

Access Grafana:
```bash
kubectl port-forward svc/monitoring-grafana -n monitoring 3000:80
```

## Quick Setup Script

For automated installation, use the provided scripts:
- `k8s.sh` - AWS CLI, kubectl, eksctl setup
- `agent.sh` - Jenkins agent with SonarQube scanner

## Architecture

```
Jenkins Pipeline → SonarQube → Trivy → Docker Build → EKS Deploy → ArgoCD → Monitoring
```

## Default Credentials

- **SonarQube**: admin/admin
- **Grafana**: admin/prom-operator
- **ArgoCD**: admin/[get from secret]

## Troubleshooting

- Ensure AWS credentials are configured
- Check EKS cluster status: `kubectl get nodes`
- Verify all pods are running: `kubectl get pods --all-namespaces`