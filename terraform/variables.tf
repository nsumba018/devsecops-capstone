variable "aws_region" {
  default = "eu-west-1"
}

variable "ami_id" {
  description = "Ubuntu 22.04 AMI"
}

variable "key_name" {
  description = "AWS Key Pair Name"
}
