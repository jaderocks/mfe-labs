Micro Frontend Research
=======================

### Goal
1. For demo prupose, so the example may not ready for production
2. Cover as many approach to implement Micro Frontend

### Setup

1. install `openresty`

```
export HOMEBREW_API_DOMAIN="https://mirrors.tuna.tsinghua.edu.cn/homebrew-bottles/api"
export HOMEBREW_BOTTLE_DOMAIN="https://mirrors.tuna.tsinghua.edu.cn/homebrew-bottles"
export HOMEBREW_BREW_GIT_REMOTE="https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/brew.git"
export HOMEBREW_CORE_GIT_REMOTE="https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/homebrew-core.git"
export HOMEBREW_PIP_INDEX_URL="https://pypi.tuna.tsinghua.edu.cn/simple"

brew install openresty/brew/openresty

export PATH=/usr/local/opt/openresty/bin/:$PATH
```
2. Run application 

```
openresty -p `pwd`/ -c nginx.conf
```