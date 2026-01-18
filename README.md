
```bash
# Clone repository
git clone <repository>
cd Nestjs

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Start with Docker
docker-compose up -d

# Or run locally
npm run dev
```

### Verify Setup

```bash
curl http://localhost:3000/jobs
```
# Install dependencies
npm install

# Start in watch mode
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Code quality
npm run lint
npm run format

# Testing
npm run test
npm run test:cov

# Database
npm run migration:generate
npm run migration:run
```

### Local Development
```bash
docker-compose up -d
```