#!/bin/bash

# AWS EC2 Ubuntu インスタンス デプロイスクリプト (Linux/macOS対応)
# CloudFormation を使用したUbuntu開発環境の構築
# Usage: ./deploy-ubuntu-ec2.sh

set -e

# 色付きログ用の設定
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# ログ関数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_debug() {
    echo -e "${PURPLE}[DEBUG]${NC} $1"
}

# 設定可能な変数
STACK_NAME="${STACK_NAME:-ubuntu-dev-stack}"
INSTANCE_TYPE="${INSTANCE_TYPE:-t3.medium}"
KEY_NAME="${KEY_NAME}"
ALLOWED_CIDR="${ALLOWED_CIDR}"
INSTANCE_NAME="${INSTANCE_NAME:-Ubuntu-Dev-Instance}"
VOLUME_SIZE="${VOLUME_SIZE:-20}"
VOLUME_TYPE="${VOLUME_TYPE:-gp3}"
AWS_REGION="${AWS_REGION:-$(aws configure get region 2>/dev/null || echo 'us-east-1')}"
TEMPLATE_FILE="$(dirname "$0")/cloudformation-ubuntu-ec2.yaml"
ENABLE_VSCODE="${ENABLE_VSCODE:-true}"

# ヘルプ表示
show_help() {
    cat << EOF
AWS EC2 Ubuntu インスタンス デプロイスクリプト (Linux/macOS対応)
CloudFormationを使用したUbuntu 22.04 開発環境の自動構築

対象環境: Linux, macOS
接続方法: SSH (OpenSSH)
開発ツール: Node.js, Python, Docker, Git, AWS CLI, Bedrock SDK

使用方法:
    $0 [オプション]

必須パラメータ:
    --key-name KEY_NAME         既存のEC2キーペア名
    --allowed-cidr CIDR         SSHアクセスを許可するCIDRブロック (例: 203.0.113.0/32)

オプション:
    --stack-name NAME           CloudFormationスタック名 (デフォルト: ubuntu-dev-stack)
    --instance-type TYPE        EC2インスタンスタイプ (デフォルト: t3.medium)
    --instance-name NAME        インスタンス名 (デフォルト: Ubuntu-Dev-Instance)
    --volume-size SIZE          EBSボリュームサイズ (GB) (デフォルト: 20)
    --volume-type TYPE          EBSボリュームタイプ (デフォルト: gp3)
    --region REGION             AWSリージョン (デフォルト: 現在の設定または us-east-1)
    --template-file PATH        CloudFormationテンプレートファイルパス
    --enable-vscode BOOL        VS Code Serverを有効化 (デフォルト: true)
    --dry-run                   ドライラン（実際にはデプロイしない）
    --delete                    スタックを削除
    --help                      このヘルプを表示

環境設定:
    # AWS CLI インストール (Ubuntu/Debian)
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip && sudo ./aws/install

    # AWS CLI インストール (macOS)
    brew install awscli

    # AWS認証情報の設定
    aws configure

    # 現在のIPアドレスを自動取得
    export ALLOWED_CIDR=\$(curl -s https://checkip.amazonaws.com/)/32

例:
    # 基本的な使用方法（現在のIPを自動検出）
    $0 --key-name my-keypair --allowed-cidr \$(curl -s https://checkip.amazonaws.com/)/32

    # カスタム設定
    $0 --key-name my-keypair --allowed-cidr 203.0.113.0/32 \\
       --instance-type t3.large --stack-name my-ubuntu-dev

    # 高性能インスタンス（VS Code Server無効）
    $0 --key-name my-keypair --allowed-cidr \$(curl -s https://checkip.amazonaws.com/)/32 \\
       --instance-type t3.xlarge --enable-vscode false

    # 環境変数を使用
    export KEY_NAME=my-keypair
    export ALLOWED_CIDR=\$(curl -s https://checkip.amazonaws.com/)/32
    export INSTANCE_TYPE=t3.large
    $0

    # スタック削除
    $0 --delete --stack-name ubuntu-dev-stack

接続後の手順:
    1. SSH接続: ssh -i ~/.ssh/your-keypair.pem ubuntu@PUBLIC_IP
    2. セットアップ確認: cat ~/WELCOME.md
    3. Bedrockテスト: aws bedrock list-foundation-models --region us-east-1
    4. サンプル実行: cd ~/projects/bedrock-python && python3 main.py
    5. VS Code Server: http://PUBLIC_IP:8080 (パスワードは ~/.config/code-server/config.yaml)
EOF
}

# パラメータ解析
DRY_RUN=false
DELETE_STACK=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --key-name)
            KEY_NAME="$2"
            shift 2
            ;;
        --allowed-cidr)
            ALLOWED_CIDR="$2"
            shift 2
            ;;
        --stack-name)
            STACK_NAME="$2"
            shift 2
            ;;
        --instance-type)
            INSTANCE_TYPE="$2"
            shift 2
            ;;
        --instance-name)
            INSTANCE_NAME="$2"
            shift 2
            ;;
        --volume-size)
            VOLUME_SIZE="$2"
            shift 2
            ;;
        --volume-type)
            VOLUME_TYPE="$2"
            shift 2
            ;;
        --region)
            AWS_REGION="$2"
            shift 2
            ;;
        --template-file)
            TEMPLATE_FILE="$2"
            shift 2
            ;;
        --enable-vscode)
            ENABLE_VSCODE="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --delete)
            DELETE_STACK=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            log_error "不明なオプション: $1"
            show_help
            exit 1
            ;;
    esac
done

# 前提条件チェック
check_prerequisites() {
    log_info "前提条件をチェック中..."

    # OS検出
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        log_debug "Linux環境を検出"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        log_debug "macOS環境を検出"
    else
        log_warning "未サポートのOS: $OSTYPE（Linux/macOSで動作確認済み）"
    fi

    # AWS CLIの確認
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLIがインストールされていません"
        log_info "インストール方法:"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            log_info "  macOS: brew install awscli"
        else
            log_info "  Linux: curl \"https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip\" -o \"awscliv2.zip\" && unzip awscliv2.zip && sudo ./aws/install"
        fi
        exit 1
    fi

    # AWS認証情報の確認
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS認証情報が設定されていません"
        log_info "設定方法: aws configure"
        exit 1
    fi

    # AWS認証情報の表示
    local caller_identity
    caller_identity=$(aws sts get-caller-identity 2>/dev/null)
    local account_id
    account_id=$(echo "$caller_identity" | jq -r '.Account' 2>/dev/null || echo "unknown")
    local user_arn
    user_arn=$(echo "$caller_identity" | jq -r '.Arn' 2>/dev/null || echo "unknown")
    log_debug "AWS Account: $account_id"
    log_debug "AWS User/Role: $user_arn"

    # テンプレートファイルの確認
    if [[ ! -f "$TEMPLATE_FILE" ]]; then
        log_error "CloudFormationテンプレートファイルが見つかりません: $TEMPLATE_FILE"
        exit 1
    fi

    # jqコマンドの確認（オプション）
    if ! command -v jq &> /dev/null; then
        log_warning "jqがインストールされていません（JSONパース用、オプション）"
    fi

    log_success "前提条件チェック完了"
}

# パラメータ検証
validate_parameters() {
    if [[ "$DELETE_STACK" == "true" ]]; then
        return 0
    fi

    if [[ -z "$KEY_NAME" ]]; then
        log_error "KEY_NAME が指定されていません。--key-name オプションを使用してください。"
        exit 1
    fi

    if [[ -z "$ALLOWED_CIDR" ]]; then
        log_error "ALLOWED_CIDR が指定されていません。--allowed-cidr オプションを使用してください。"
        log_warning "セキュリティのため、0.0.0.0/0 ではなく、特定のIPアドレス/32 を指定することを推奨します。"
        log_info "現在のIPを取得: curl -s https://checkip.amazonaws.com/"
        exit 1
    fi

    # CIDR形式の検証
    if [[ ! "$ALLOWED_CIDR" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/[0-9]+$ ]]; then
        log_error "ALLOWED_CIDR の形式が正しくありません。例: 203.0.113.0/32"
        exit 1
    fi

    # キーペア存在確認
    if ! aws ec2 describe-key-pairs --key-names "$KEY_NAME" --region "$AWS_REGION" &> /dev/null; then
        log_error "キーペア '$KEY_NAME' が存在しません（リージョン: $AWS_REGION）"
        log_info "キーペア作成方法: aws ec2 create-key-pair --key-name $KEY_NAME --query 'KeyMaterial' --output text > ~/.ssh/$KEY_NAME.pem"
        exit 1
    fi

    # インスタンスタイプの検証
    local valid_types=("t3.micro" "t3.small" "t3.medium" "t3.large" "t3.xlarge" "t3.2xlarge" "m5.large" "m5.xlarge" "m5.2xlarge" "c5.large" "c5.xlarge")
    if [[ ! " ${valid_types[@]} " =~ " ${INSTANCE_TYPE} " ]]; then
        log_warning "インスタンスタイプ '$INSTANCE_TYPE' はテンプレートでサポートされていない可能性があります"
    fi

    # リージョンの確認
    if ! aws ec2 describe-regions --region-names "$AWS_REGION" &> /dev/null; then
        log_error "リージョン '$AWS_REGION' が無効です"
        exit 1
    fi
}

# 現在のパブリックIPアドレスを取得
get_public_ip() {
    local public_ip
    # 複数のサービスを試す
    for service in "https://checkip.amazonaws.com/" "https://ipv4.icanhazip.com/" "https://ifconfig.me/ip"; do
        public_ip=$(curl -s --connect-timeout 5 "$service" 2>/dev/null | tr -d '\n' || echo "")
        if [[ -n "$public_ip" && "$public_ip" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            log_debug "IPアドレス取得成功: $service -> $public_ip"
            echo "$public_ip/32"
            return 0
        fi
    done
    log_warning "パブリックIPアドレスの自動取得に失敗しました"
    echo ""
}

# スタック削除
delete_stack() {
    log_info "スタック '$STACK_NAME' を削除中..."

    if aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$AWS_REGION" &> /dev/null; then
        # Elastic IPの解放確認
        log_info "関連リソースの確認中..."
        
        aws cloudformation delete-stack --stack-name "$STACK_NAME" --region "$AWS_REGION"

        log_info "スタック削除の完了を待機中... (最大10分)"
        if aws cloudformation wait stack-delete-complete --stack-name "$STACK_NAME" --region "$AWS_REGION" 2>/dev/null; then
            log_success "スタック '$STACK_NAME' が正常に削除されました"
        else
            log_error "スタック削除でエラーが発生しました"
            log_info "削除状況を確認してください:"
            aws cloudformation describe-stack-events --stack-name "$STACK_NAME" --region "$AWS_REGION" \
                --query 'StackEvents[?ResourceStatus==`DELETE_FAILED`].[Timestamp,LogicalResourceId,ResourceStatusReason]' \
                --output table 2>/dev/null || true
            exit 1
        fi
    else
        log_warning "スタック '$STACK_NAME' は存在しません（リージョン: $AWS_REGION）"
    fi
}

# コスト見積もり表示
show_cost_estimate() {
    log_info "月額コスト見積もり (us-east-1 基準):"
    case "$INSTANCE_TYPE" in
        "t3.micro")
            echo "  インスタンス: ~$8/月 (750時間無料枠対象)"
            ;;
        "t3.small")
            echo "  インスタンス: ~$16/月"
            ;;
        "t3.medium")
            echo "  インスタンス: ~$33/月"
            ;;
        "t3.large")
            echo "  インスタンス: ~$67/月"
            ;;
        "t3.xlarge")
            echo "  インスタンス: ~$134/月"
            ;;
        "t3.2xlarge")
            echo "  インスタンス: ~$268/月"
            ;;
        *)
            echo "  インスタンス: 料金は公式サイトをご確認ください"
            ;;
    esac
    
    local ebs_cost
    ebs_cost=$(echo "$VOLUME_SIZE * 0.08" | bc 2>/dev/null || echo "計算不可")
    echo "  EBS ストレージ (${VOLUME_SIZE}GB): ~\$${ebs_cost}/月"
    echo "  Elastic IP: ~\$3.65/月 (アタッチ時は無料)"
    echo "  データ転送: 送信1GBあたり ~\$0.09"
    echo ""
    log_warning "実際の料金は利用状況とリージョンにより異なります"
}

# スタックデプロイ
deploy_stack() {
    log_info "CloudFormationスタックをデプロイ中..."

    # パラメータの準備
    local parameters=(
        "ParameterKey=InstanceType,ParameterValue=$INSTANCE_TYPE"
        "ParameterKey=KeyName,ParameterValue=$KEY_NAME"
        "ParameterKey=AllowedCidrBlock,ParameterValue=$ALLOWED_CIDR"
        "ParameterKey=InstanceName,ParameterValue=$INSTANCE_NAME"
        "ParameterKey=VolumeSize,ParameterValue=$VOLUME_SIZE"
        "ParameterKey=VolumeType,ParameterValue=$VOLUME_TYPE"
        "ParameterKey=EnableVSCodeServer,ParameterValue=$ENABLE_VSCODE"
    )

    # 設定表示
    log_info "デプロイ設定:"
    echo "  スタック名: $STACK_NAME"
    echo "  リージョン: $AWS_REGION"
    echo "  インスタンスタイプ: $INSTANCE_TYPE"
    echo "  キーペア: $KEY_NAME"
    echo "  許可CIDR: $ALLOWED_CIDR"
    echo "  インスタンス名: $INSTANCE_NAME"
    echo "  ボリュームサイズ: ${VOLUME_SIZE}GB ($VOLUME_TYPE)"
    echo "  VS Code Server: $ENABLE_VSCODE"
    echo "  テンプレートファイル: $TEMPLATE_FILE"
    echo ""

    # コスト見積もり表示
    show_cost_estimate

    if [[ "$DRY_RUN" == "true" ]]; then
        log_warning "ドライランモード - 実際のデプロイは行いません"
        log_info "テンプレート検証を実行中..."
        if aws cloudformation validate-template --template-body "file://$TEMPLATE_FILE" --region "$AWS_REGION" > /dev/null; then
            log_success "テンプレートは有効です"
        else
            log_error "テンプレートに問題があります"
            exit 1
        fi
        return 0
    fi

    # デプロイ確認
    if [[ "$ALLOWED_CIDR" == "0.0.0.0/0" ]]; then
        log_warning "⚠️  セキュリティ警告: 全世界からSSHアクセス可能な設定です"
        read -p "本当に続行しますか？ [y/N]: " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "デプロイを中止しました"
            exit 0
        fi
    fi

    # スタック存在確認
    local stack_exists=false
    if aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$AWS_REGION" &> /dev/null; then
        stack_exists=true
    fi

    if [[ "$stack_exists" == "true" ]]; then
        log_info "既存スタックを更新中..."

        # 変更セットの作成
        local change_set_name="changeset-$(date +%Y%m%d-%H%M%S)"

        if aws cloudformation create-change-set \
            --stack-name "$STACK_NAME" \
            --change-set-name "$change_set_name" \
            --template-body "file://$TEMPLATE_FILE" \
            --parameters "${parameters[@]}" \
            --capabilities CAPABILITY_IAM \
            --region "$AWS_REGION" > /dev/null; then

            # 変更セットの詳細表示
            log_info "変更セットの詳細:"
            local changes
            changes=$(aws cloudformation describe-change-set \
                --stack-name "$STACK_NAME" \
                --change-set-name "$change_set_name" \
                --region "$AWS_REGION" \
                --query 'Changes[].{Action:Action,ResourceType:ResourceChange.ResourceType,LogicalResourceId:ResourceChange.LogicalResourceId}' \
                --output table 2>/dev/null)
            
            if [[ -n "$changes" ]]; then
                echo "$changes"
                echo ""
                # 実行確認
                read -p "変更セットを実行しますか？ [y/N]: " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    aws cloudformation execute-change-set \
                        --stack-name "$STACK_NAME" \
                        --change-set-name "$change_set_name" \
                        --region "$AWS_REGION"
                else
                    log_info "変更セットを削除中..."
                    aws cloudformation delete-change-set \
                        --stack-name "$STACK_NAME" \
                        --change-set-name "$change_set_name" \
                        --region "$AWS_REGION"
                    log_info "変更セットが削除されました"
                    return 0
                fi
            else
                log_info "変更はありません"
                aws cloudformation delete-change-set \
                    --stack-name "$STACK_NAME" \
                    --change-set-name "$change_set_name" \
                    --region "$AWS_REGION"
                return 0
            fi
        else
            log_error "変更セットの作成に失敗しました"
            exit 1
        fi
    else
        log_info "新しいスタックを作成中..."

        aws cloudformation create-stack \
            --stack-name "$STACK_NAME" \
            --template-body "file://$TEMPLATE_FILE" \
            --parameters "${parameters[@]}" \
            --capabilities CAPABILITY_IAM \
            --region "$AWS_REGION" \
            --tags \
                Key=CreatedBy,Value="deploy-script" \
                Key=Environment,Value="development" \
                Key=Project,Value="bedrock-engineer"
    fi

    # デプロイ完了待機
    log_info "スタックのデプロイ完了を待機中... (最大15分)"
    log_info "進行状況: https://console.aws.amazon.com/cloudformation/home?region=$AWS_REGION#/stacks/stackinfo?stackId=$STACK_NAME"

    local wait_start_time
    wait_start_time=$(date +%s)
    
    if aws cloudformation wait stack-create-complete --stack-name "$STACK_NAME" --region "$AWS_REGION" 2>/dev/null || \
       aws cloudformation wait stack-update-complete --stack-name "$STACK_NAME" --region "$AWS_REGION" 2>/dev/null; then
        
        local wait_end_time
        wait_end_time=$(date +%s)
        local wait_duration
        wait_duration=$((wait_end_time - wait_start_time))
        
        log_success "スタックのデプロイが完了しました！ (所要時間: ${wait_duration}秒)"
    else
        log_error "スタックのデプロイに失敗しました"
        log_info "詳細なエラー情報:"
        aws cloudformation describe-stack-events --stack-name "$STACK_NAME" --region "$AWS_REGION" \
            --query 'StackEvents[?ResourceStatus==`CREATE_FAILED` || ResourceStatus==`UPDATE_FAILED`].[Timestamp,LogicalResourceId,ResourceStatusReason]' \
            --output table 2>/dev/null || echo "エラー詳細の取得に失敗"
        exit 1
    fi
}

# 出力情報表示
show_outputs() {
    log_info "スタック出力情報:"

    # 出力情報を取得
    local outputs
    if outputs=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$AWS_REGION" \
        --query 'Stacks[0].Outputs' --output table 2>/dev/null); then
        echo "$outputs"
    else
        log_warning "出力情報の取得に失敗しました"
        return 1
    fi

    echo ""

    # 個別の重要な情報を抽出
    local public_ip
    public_ip=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$AWS_REGION" \
        --query 'Stacks[0].Outputs[?OutputKey==`PublicIpAddress`].OutputValue' --output text 2>/dev/null)

    local vscode_url
    vscode_url=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$AWS_REGION" \
        --query 'Stacks[0].Outputs[?OutputKey==`VSCodeServerURL`].OutputValue' --output text 2>/dev/null)

    if [[ -n "$public_ip" && "$public_ip" != "None" ]]; then
        log_success "🚀 Ubuntu開発環境が準備できました！"
        echo ""
        echo "📋 接続情報:"
        echo "  パブリックIPアドレス: $public_ip"
        echo "  SSH接続コマンド: ssh -i ~/.ssh/$KEY_NAME.pem ubuntu@$public_ip"
        echo ""
        
        if [[ -n "$vscode_url" && "$vscode_url" != "None" ]]; then
            echo "💻 VS Code Server:"
            echo "  URL: $vscode_url"
            echo "  パスワード確認: ssh -i ~/.ssh/$KEY_NAME.pem ubuntu@$public_ip 'cat ~/.config/code-server/config.yaml | grep password'"
            echo ""
        fi
        
        echo "🛠️  次のステップ:"
        echo "1. SSH接続: ssh -i ~/.ssh/$KEY_NAME.pem ubuntu@$public_ip"
        echo "2. セットアップ確認: cat ~/WELCOME.md"
        echo "3. インストール進行確認: sudo tail -f /var/log/user-data.log"
        echo "4. Bedrockテスト: aws bedrock list-foundation-models --region us-east-1"
        echo "5. サンプル実行:"
        echo "   - Python: cd ~/projects/bedrock-python && python3 main.py"
        echo "   - Node.js: cd ~/projects/bedrock-nodejs && npm start"
        echo ""
        
        log_info "🕐 セットアップ完了まで5-10分程度お待ちください"
        log_info "   進行状況: sudo tail -f /var/log/user-data.log"
    else
        log_error "パブリックIPアドレスの取得に失敗しました"
    fi
}

# メイン実行
main() {
    echo "============================================="
    echo "🐧 AWS EC2 Ubuntu 開発環境デプロイスクリプト"
    echo "============================================="
    log_info "Bedrock Engineer Ubuntu Development Environment"
    log_info "スクリプト開始時刻: $(date)"
    echo ""

    check_prerequisites

    if [[ "$DELETE_STACK" == "true" ]]; then
        delete_stack
        exit 0
    fi

    validate_parameters

    # 自動的に現在のIPを提案
    if [[ "$ALLOWED_CIDR" == "0.0.0.0/0" ]]; then
        local current_ip
        current_ip=$(get_public_ip)
        if [[ -n "$current_ip" ]]; then
            log_warning "🔒 セキュリティのため、現在のIPアドレス ($current_ip) の使用を推奨します"
            read -p "現在のIPアドレスを使用しますか？ [Y/n]: " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Nn]$ ]]; then
                log_warning "0.0.0.0/0 を使用します（セキュリティリスクあり）"
            else
                ALLOWED_CIDR="$current_ip"
                log_info "許可CIDRを $ALLOWED_CIDR に変更しました"
            fi
        fi
    fi

    deploy_stack

    if [[ "$DRY_RUN" != "true" ]]; then
        echo ""
        show_outputs
    fi

    echo ""
    log_success "✅ デプロイスクリプト完了"
    log_info "終了時刻: $(date)"
    echo "============================================="
}

# エラーハンドリング
trap 'log_error "スクリプトが予期せず終了しました (行: $LINENO)"' ERR

# スクリプト実行
main "$@"