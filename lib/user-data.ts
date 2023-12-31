export const installNode = [
  "sudo apt-get update -y",
  "sudo apt-get install -y ca-certificates curl gnupg",
  "sudo mkdir -p /etc/apt/keyrings",
  "curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg",
  "NODE_MAJOR=20",
  `echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list`,
  "sudo apt-get update -y",
  "sudo apt-get install nodejs -y",
];
//---------------
export const installDocker = [
  "sudo apt install nodejs npm -y",
  "sudo apt update -y",
  "sudo apt install -y docker.io",
  "sudo systemctl start docker",
  "sudo systemctl enable docker",
  "sudo usermod -aG docker $USER",
];
//
export const installAwsCli = [
  "sudo apt update -y",
  "sudo apt install -y awscli",
  "sudo apt install -y python3-pip",
  "sudo pip3 install awscli --upgrade",
];
