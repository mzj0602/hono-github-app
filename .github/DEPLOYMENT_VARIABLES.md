Required GitHub Actions repository variables:

- `AWS_ROLE_ARN`
- `AWS_REGION`
- `LAMBDA_FUNCTION_NAME`
- `FRONTEND_BUCKET_NAME`
- `VITE_SERVER_URL`

Optional repository variables:

- `CLOUDFRONT_DISTRIBUTION_ID`

Expected values:

- `AWS_ROLE_ARN`: IAM role trusted by GitHub OIDC and allowed to update Lambda, upload to S3, and optionally invalidate CloudFront.
- `AWS_REGION`: The AWS region where Lambda, S3, and CloudFront resources live, for example `ap-northeast-1`.
- `LAMBDA_FUNCTION_NAME`: The Lambda function name you created manually in the AWS console.
- `FRONTEND_BUCKET_NAME`: The S3 bucket that serves the built frontend assets.
- `VITE_SERVER_URL`: The public API Gateway base URL used by the frontend build.
- `CLOUDFRONT_DISTRIBUTION_ID`: Needed only if you publish the frontend through CloudFront and want automatic cache invalidation.
