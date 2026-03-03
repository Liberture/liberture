# Skill Name

**Pillar:** [Cognition | Recovery | Fueling | Mental | Physicality | Finance]  
**Author:** @your-github-username  
**Version:** 1.0.0

## Description

One paragraph explaining what this skill does and why it's useful.

## Interface

### Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `param_name` | string | yes | What this parameter does |
| `optional_param` | number | no | Optional parameter with default |

### Outputs

| Field | Type | Description |
|-------|------|-------------|
| `result` | string | What gets returned |
| `data` | object | Additional data structure |

### Errors

| Code | Description |
|------|-------------|
| `INVALID_INPUT` | When input validation fails |
| `API_ERROR` | When external service fails |

## Examples

### Basic Usage

**Input:**
```json
{
  "param_name": "example value"
}
```

**Output:**
```json
{
  "result": "success",
  "data": {
    "processed": true
  }
}
```

### With Optional Parameters

**Input:**
```json
{
  "param_name": "example",
  "optional_param": 42
}
```

**Output:**
```json
{
  "result": "success",
  "data": {
    "processed": true,
    "custom_value": 42
  }
}
```

## Installation

```bash
# Copy to OpenClaw skills directory
cp -r skill-name ~/.openclaw/skills/

# Or add to your agent's skill path
```

## Configuration

If your skill needs API keys or configuration:

```bash
# Set environment variable
export SKILL_API_KEY="your-key-here"

# Or add to ~/.openclaw/config
```

## Dependencies

List any external dependencies:
- `curl` for HTTP requests
- Node.js 18+ (if using JS implementation)
- Python 3.10+ (if using Python)

## Notes

Any additional context, limitations, or tips for using this skill effectively.
