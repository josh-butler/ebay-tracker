.PHONY: all \
test unit invoke \
sam-build sam-deploy sam-package \
install pre-build build post-build \

-include Makefile.env

ROOT_PATH=$(PWD)
SRC_PATH=$(ROOT_PATH)/src
BUILD_PATH=$(ROOT_PATH)/.aws-sam/build
BIN:=$(ROOT_PATH)/node_modules/.bin
ESLINT=$(BIN)/eslint
JEST=$(BIN)/jest

SAM_ARTIFACT_BUCKET?=lambdadeploys
AWS_REGION?=us-east-1
AWS_OPTIONS=

ifdef AWS_PROFILE
AWS_OPTIONS=--profile $(AWS_PROFILE)
endif

all: lint coverage

help: ## Describe all available commands
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n\nTargets:\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

clean: ## Delete local artifacts
	rm -rf coverage node_modules

npmi: ## Install npm dependencies
	npm i

lint: ## Run code linter
	@echo "Linting code..."
	@$(ESLINT) --quiet --ext .js $(SRC_PATH)
	@echo "Linting PASSED"

unit: ## Run unit tests
	@echo "Running unit tests..."
	@$(JEST)

coverage: ## Run unit tests & coverage report
	@echo "Running unit tests and coverage..."
	@$(JEST) --coverage

invoke: ## Invoke individual Lambda
	sam local invoke $(LAMBDA_NAME) --event $(LAMBDA_EVENT) --env-vars env.json $(AWS_OPTIONS)

sam-build:
	sam build

sam-package:
	cd $(BUILD_PATH) && sam package \
	--template-file template.yaml \
	--s3-bucket $(SAM_ARTIFACT_BUCKET) \
	--output-template-file packaged.yaml \
	$(AWS_OPTIONS)

sam-deploy: 
	cd $(BUILD_PATH) && sam deploy \
	--template-file packaged.yaml \
	--stack-name $(SAM_STACK_NAME) \
	--capabilities CAPABILITY_NAMED_IAM \
	$(DEPLOY_PARAMS) $(AWS_OPTIONS)