# Amazon Q Customization and Usage Notes

## Amazon Q Subscription Tiers

### Free Tier
- **Cost**: $0
- **Features**: 
  - Basic Q assistance with general knowledge
  - Standard AWS/programming help
  - No custom codebase training
  - General React Native, Node.js, AWS guidance

### Amazon Q Developer Pro
- **Cost**: $19/month per user
- **Features**:
  - **Custom code training** on your repositories
  - Private codebase analysis
  - Project-specific suggestions
  - Enhanced security scanning
  - Organization-wide customization (with admin controls)

### Enterprise Plans
- **Cost**: Custom pricing
- **Features**:
  - Advanced compliance features
  - Admin controls and policies
  - Organization-wide deployment
  - Custom training at scale

## Customization Options Available

### Code Customizations (Pro+ Plans)
- **Custom Libraries**: Train Q on specific codebase and internal libraries
- **Coding Standards**: Enforce team's coding patterns and best practices
- **Architecture Patterns**: Customize suggestions based on preferred frameworks
- **API Guidelines**: Train on internal APIs and documentation

### Workspace Customizations (All Plans)
- **Project Rules**: Create `.amazonq/rules/` files for project-specific guidance
- **Saved Prompts**: Custom `@prompt` templates for common tasks
- **Context Preferences**: Configure which files/folders Q should prioritize

## How Custom Training Works (Pro+ Plans)

### Automatic Training
```bash
# Q automatically learns from:
- Your open files and workspace
- Git repository history
- Project documentation
- Code patterns you use
```

### Manual Customization
```bash
# Create project rules
mkdir .amazonq/rules/
echo "Use React Native with Expo" > .amazonq/rules/frontend.md
echo "Prefer AWS Lambda for backend" > .amazonq/rules/backend.md
```

### Repository Integration
- Connect your GitHub/GitLab repositories
- Q analyzes your coding patterns
- Learns your architecture preferences
- Suggests code following your style

## JetBond-Specific Customizations (If Upgraded)

### Potential Custom Training Areas
- **React Native Best Practices**: Optimize for Expo and mobile development
- **AWS Serverless Patterns**: Focus on Lambda + DynamoDB architectures
- **Bilingual Code Comments**: Handle Chinese/English mixed codebases
- **Gig Economy Domain**: Understand job matching and real-time systems

### Project Rules Examples
```markdown
# .amazonq/rules/frontend.md
- Use React Native with Expo framework
- Prefer functional components over class components
- Use React Navigation for routing
- Implement bilingual support (Chinese/English)
- Follow mobile-first design principles

# .amazonq/rules/backend.md
- Use AWS Lambda for serverless functions
- Prefer DynamoDB for data storage
- Implement proper error handling
- Use DeepSeek API for AI embeddings
- Follow AWS security best practices

# .amazonq/rules/architecture.md
- Real-time features use WebSocket API Gateway
- Implement proper caching strategies
- Use AWS SNS for push notifications
- Follow microservices patterns
- Optimize for mobile app performance
```

## Current Recommendation for JetBond

### Stick with Free Tier (For Now)
**Reasons:**
- Building a personal/startup project
- Free tier provides sufficient React Native, AWS, Node.js knowledge
- Q already understands standard patterns without custom training
- Can upgrade later when codebase grows

### When to Consider Upgrading
- **Codebase Size**: When you have 10,000+ lines of custom code
- **Team Growth**: When multiple developers join the project
- **Complex Patterns**: When you develop unique architectural patterns
- **Security Requirements**: When you need enhanced security scanning

## Checking Your Current Subscription

### Methods to Check
1. **AWS Console**: Log into AWS account → Search "Amazon Q"
2. **IDE Settings**: Check VS Code Amazon Q extension settings
3. **AWS Billing Console**: Go to Billing & Cost Management
4. **Amazon Q Console**: Visit https://q.aws.amazon.com

### Note on AWS CLI
- **No `aws q` command**: Amazon Q is managed separately from traditional AWS CLI
- **Service Integration**: Q integrates with AWS services but isn't CLI-accessible
- **Management**: Use web console or IDE plugin for configuration

## Usage Tips for JetBond Development

### Effective Prompting
```bash
# Good prompts for JetBond
"Create a React Native screen for job posting with form validation"
"Design a DynamoDB schema for user profiles with employee/employer modes"
"Implement WebSocket connection for real-time job notifications"
"Create AWS Lambda function for DeepSeek API integration"
```

### Context Management
```bash
# Use file references
@architecture.md "How should I implement the matching algorithm?"
@requirements.md "What are the key features for employee interface?"

# Use workspace context
@workspace "Review the current project structure"
```

### Project-Specific Guidance
```bash
# Create saved prompts
@prompt jetbond-component "Create a React Native component following JetBond design patterns"
@prompt aws-lambda "Create an AWS Lambda function for JetBond backend"
```

## Cost-Benefit Analysis

### Free Tier Benefits
- **Zero Cost**: No monthly subscription fees
- **Sufficient Knowledge**: Covers React Native, AWS, Node.js
- **General Patterns**: Understands common development practices
- **Learning Tool**: Great for learning and prototyping

### Pro Tier Benefits ($19/month)
- **Custom Training**: Learns your specific codebase
- **Enhanced Security**: Better vulnerability detection
- **Team Features**: Shared knowledge and patterns
- **Advanced Suggestions**: More contextual recommendations

### ROI Calculation for JetBond
```
Monthly Development Time Saved: ~5-10 hours
Hourly Value of Development Time: $50-100
Monthly Value: $250-1000
Pro Subscription Cost: $19
ROI: 13x - 53x return on investment
```

**Conclusion**: Even modest time savings justify Pro subscription for active development.

## Future Considerations

### When JetBond Scales
- **Multiple Developers**: Pro tier becomes more valuable
- **Complex Codebase**: Custom training provides better suggestions
- **Production Deployment**: Enhanced security scanning important
- **Maintenance Phase**: Code quality improvements more critical

### Integration Opportunities
- **CI/CD Pipeline**: Integrate Q suggestions into code review
- **Documentation**: Auto-generate docs from Q analysis
- **Code Quality**: Use Q for refactoring suggestions
- **Onboarding**: Help new team members understand codebase

This analysis suggests starting with the free tier for JetBond development and upgrading to Pro when the project reaches production scale or when team size grows.