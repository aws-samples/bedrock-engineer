#!/bin/bash

# AWS EC2 Windows インスタンス デプロイスクリプト (macOS専用)
# CloudFormation を使用したWindows開発環境の構築
# Usage: ./deploy-windows-ec2.sh

set -e

# 色付きログ用の設定
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# 設定可能な変数
STACK_NAME="${STACK_NAME:-windows-dev-stack}"
INSTANCE_TYPE="${INSTANCE_TYPE:-t3.large}"
KEY_NAME="${KEY_NAME}"
ALLOWED_CIDR="${ALLOWED_CIDR}"
INSTANCE_NAME="${INSTANCE_NAME:-Windows-Dev-Instance}"
VOLUME_SIZE="${VOLUME_SIZE:-30}"
VOLUME_TYPE="${VOLUME_TYPE:-gp3}"
AWS_REGION="${AWS_REGION:-$(aws configure get region)}"
TEMPLATE_FILE="$(dirname "$0")/cloudformation-windows-ec2.yaml"

# ヘルプ表示
show_help() {
    cat << EOF
AWS EC2 Windows インスタンス デプロイスクリプト (macOS専用)
CloudFormationを使用したWindows開発環境の自動構築

対象環境: macOS
接続方法: Microsoft Remote Desktop (App Store)

使用方法:
    $0 [オプション]

必須パラメータ:
    --key-name KEY_NAME         既存のEC2キーペア名
    --allowed-cidr CIDR         RDPアクセスを許可するCIDRブロック (例: 203.0.113.0/32)

オプション:
    --stack-name NAME           CloudFormationスタック名 (デフォルト: windows-dev-stack)
    --instance-type TYPE        EC2インスタンスタイプ (デフォルト: t3.large)
    --instance-name NAME        インスタンス名 (デフォルト: Windows-Dev-Instance)
    --volume-size SIZE          EBSボリュームサイズ (GB) (デフォルト: 30)
    --volume-type TYPE          EBSボリュームタイプ (デフォルト: gp3)
    --region REGION             AWSリージョン (デフォルト: 現在の設定)
    --template-file PATH        CloudFormationテンプレートファイルパス
    --dry-run                   ドライラン（実際にはデプロイしない）
    --delete                    スタックを削除
    --help                      このヘルプを表示

macOS環境での設定:
    # Homebrewを使用したAWS CLI インストール
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
       --instance-type t3.xlarge --stack-name my-windows-stack

    # 環境変数を使用
    export KEY_NAME=my-keypair
    export ALLOWED_CIDR=\$(curl -s https://checkip.amazonaws.com/)/32
    $0

    # スタック削除
    $0 --delete --stack-name windows-dev-stack

接続後の手順:
    1. Microsoft Remote Desktop (App Store) をインストール
    2. EC2コンソールでWindowsパスワードを取得
    3. RDP接続設定を作成
    4. Windows環境での開発開始
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

    # AWS CLIの確認
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLIがインストールされていません"
        exit 1
    fi

    # AWS認証情報の確認
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS認証情報が設定されていません"
        exit 1
    fi

    # テンプレートファイルの確認
    if [[ ! -f "$TEMPLATE_FILE" ]]; then
        log_error "CloudFormationテンプレートファイルが見つかりません: $TEMPLATE_FILE"
        exit 1
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
        exit 1
    fi
}

# 現在のパブリックIPアドレスを取得
get_public_ip() {
    local public_ip
    public_ip=$(curl -s https://checkip.amazonaws.com/ || curl -s https://ipv4.icanhazip.com/ || echo "")
    if [[ -n "$public_ip" ]]; then
        log_info "検出されたパブリックIPアドレス: $public_ip"
        echo "$public_ip/32"
    else
        echo ""
    fi
}

# スタック削除
delete_stack() {
    log_info "スタック '$STACK_NAME' を削除中..."

    if aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$AWS_REGION" &> /dev/null; then
        aws cloudformation delete-stack --stack-name "$STACK_NAME" --region "$AWS_REGION"

        log_info "スタック削除の完了を待機中..."
        aws cloudformation wait stack-delete-complete --stack-name "$STACK_NAME" --region "$AWS_REGION"

        log_success "スタック '$STACK_NAME' が正常に削除されました"
    else
        log_warning "スタック '$STACK_NAME' は存在しません"
    fi
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
    )

    # 設定表示
    log_info "デプロイ設定:"
    echo "  スタック名: $STACK_NAME"
    echo "  リージョン: $AWS_REGION"
    echo "  インスタンスタイプ: $INSTANCE_TYPE"
    echo "  キーペア: $KEY_NAME"
    echo "  許可CIDR: $ALLOWED_CIDR"
    echo "  インスタンス名: $INSTANCE_NAME"
    echo "  ボリュームサイズ: ${VOLUME_SIZE}GB"
    echo "  ボリュームタイプ: $VOLUME_TYPE"
    echo "  テンプレートファイル: $TEMPLATE_FILE"

    if [[ "$DRY_RUN" == "true" ]]; then
        log_warning "ドライランモード - 実際のデプロイは行いません"
        return 0
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

        aws cloudformation create-change-set \
            --stack-name "$STACK_NAME" \
            --change-set-name "$change_set_name" \
            --template-body "file://$TEMPLATE_FILE" \
            --parameters "${parameters[@]}" \
            --capabilities CAPABILITY_IAM \
            --region "$AWS_REGION"

        # 変更セットの詳細表示
        log_info "変更セットの詳細:"
        aws cloudformation describe-change-set \
            --stack-name "$STACK_NAME" \
            --change-set-name "$change_set_name" \
            --region "$AWS_REGION" \
            --query 'Changes[].{Action:Action,ResourceType:ResourceChange.ResourceType,LogicalResourceId:ResourceChange.LogicalResourceId}' \
            --output table

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
        log_info "新しいスタックを作成中..."

        aws cloudformation create-stack \
            --stack-name "$STACK_NAME" \
            --template-body "file://$TEMPLATE_FILE" \
            --parameters "${parameters[@]}" \
            --capabilities CAPABILITY_IAM \
            --region "$AWS_REGION" \
            --tags \
                Key=CreatedBy,Value="deploy-script" \
                Key=Environment,Value="development"
    fi

    # デプロイ完了待機
    log_info "スタックのデプロイ完了を待機中... (最大15分)"

    if aws cloudformation wait stack-create-complete --stack-name "$STACK_NAME" --region "$AWS_REGION" 2>/dev/null || \
       aws cloudformation wait stack-update-complete --stack-name "$STACK_NAME" --region "$AWS_REGION" 2>/dev/null; then
        log_success "スタックのデプロイが完了しました！"
    else
        log_error "スタックのデプロイに失敗しました"
        log_info "詳細なエラー情報を確認してください:"
        aws cloudformation describe-stack-events --stack-name "$STACK_NAME" --region "$AWS_REGION" \
            --query 'StackEvents[?ResourceStatus==`CREATE_FAILED` || ResourceStatus==`UPDATE_FAILED`].[Timestamp,LogicalResourceId,ResourceStatusReason]' \
            --output table
        exit 1
    fi
}

# 出力情報表示
show_outputs() {
    log_info "スタック出力情報:"

    local outputs
    outputs=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$AWS_REGION" \
        --query 'Stacks[0].Outputs' --output table)

    echo "$outputs"

    # RDP接続情報の抽出と表示
    local public_ip
    public_ip=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$AWS_REGION" \
        --query 'Stacks[0].Outputs[?OutputKey==`PublicIpAddress`].OutputValue' --output text)

    if [[ -n "$public_ip" ]]; then
        echo
        log_success "RDP接続情報:"
        echo "  パブリックIPアドレス: $public_ip"
        echo "  ユーザー名: Administrator"
        echo "  接続方法: EC2コンソールから管理者パスワードを取得してRDP接続"
        echo
        echo "次のステップ:"
        echo "1. EC2コンソールでインスタンスを選択"
        echo "2. 「アクション」→「セキュリティ」→「Windowsパスワードを取得」"
        echo "3. キーペアファイルをアップロードしてパスワードを復号化"
        echo "4. RDPクライアントで $public_ip:3389 に接続"
        echo "5. UserDataログの確認: C:\\UserDataLog.txt"
    fi
}

# メイン実行
main() {
    log_info "AWS EC2 Windows インスタンス デプロイスクリプト開始"

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
            log_warning "セキュリティのため、現在のIPアドレス ($current_ip) の使用を推奨します"
            read -p "現在のIPアドレスを使用しますか？ [Y/n]: " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Nn]$ ]]; then
                log_info "0.0.0.0/0 を使用します（推奨されません）"
            else
                ALLOWED_CIDR="$current_ip"
                log_info "許可CIDRを $ALLOWED_CIDR に変更しました"
            fi
        fi
    fi

    deploy_stack

    if [[ "$DRY_RUN" != "true" ]]; then
        show_outputs
    fi

    log_success "デプロイスクリプト完了"
}

# スクリプト実行
main "$@"
