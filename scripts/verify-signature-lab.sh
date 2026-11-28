#!/usr/bin/env bash
set -u
set -o pipefail

if ! command -v openssl >/dev/null 2>&1; then
  echo "openssl 不可用"
  exit 1
fi

dir=$(mktemp -d)
trap 'rm -rf "$dir"' EXIT
cd "$dir" || exit 1

printf 'document=netops-signature-lab\nstatus=approved\nlab=openssl-3.0.13\n' > payload.bin
cp payload.bin payload-tampered.bin
printf 'x' >> payload-tampered.bin

openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out signer.key 2>/dev/null
openssl req -new -x509 -key signer.key -sha256 -days 365 -subj "/CN=Demo Signer/O=Example Lab" -out signer.crt 2>/dev/null
openssl x509 -in signer.crt -pubkey -noout > signer.pub
openssl dgst -sha256 -sign signer.key -out payload.sig payload.bin

wrong_ready=0
attempt=0
while [ "$attempt" -lt 20 ] && [ "$wrong_ready" -eq 0 ]; do
  openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out wrong.key 2>/dev/null
  openssl req -new -x509 -key wrong.key -sha256 -days 365 -subj "/CN=Wrong Signer/O=Example Lab" -out wrong.crt 2>/dev/null
  openssl x509 -in wrong.crt -pubkey -noout > wrong.pub
  probe=$(openssl dgst -sha256 -verify wrong.pub -signature payload.sig payload.bin 2>&1)
  case "$probe" in
    *invalid\ padding*) wrong_ready=1 ;;
  esac
  attempt=$((attempt + 1))
done

normalize() {
  sed -E 's/^[0-9A-Fa-f]+:error:/error:/'
}

pass=0
fail=0
mark() {
  if [ "$1" -eq 0 ]; then
    pass=$((pass + 1))
    echo "判定：PASS（$2）"
  else
    fail=$((fail + 1))
    echo "判定：FAIL（$2）"
  fi
}

echo "== NetOps 数字签名实验（OpenSSL 3.0.13）=="
echo "数据：临时合成文件，退出后自动清理，不包含真实私钥"
echo

echo "[1/4] 原文验签"
echo "\$ openssl dgst -sha256 -verify signer.pub -signature payload.sig payload.bin"
orig_out=$(openssl dgst -sha256 -verify signer.pub -signature payload.sig payload.bin 2>&1)
orig_rc=$?
printf '%s\n' "$orig_out" | normalize
case "$orig_out" in
  *"Verified OK"*) ok=0 ;;
  *) ok=1 ;;
esac
mark "$ok" "原文验签成功"
echo

echo "[2/4] 篡改文件验签"
echo "\$ openssl dgst -sha256 -verify signer.pub -signature payload.sig payload-tampered.bin"
tampered_out=$(openssl dgst -sha256 -verify signer.pub -signature payload.sig payload-tampered.bin 2>&1)
tampered_rc=$?
printf '%s\n' "$tampered_out" | normalize
case "$tampered_out" in
  *bad\ signature*"Verification failure"*) ok=0 ;;
  *) ok=1 ;;
esac
mark "$ok" "篡改被识别为 bad signature"
echo

echo "[3/4] 错误公钥验签"
echo "\$ openssl dgst -sha256 -verify wrong.pub -signature payload.sig payload.bin"
wrong_out=$(openssl dgst -sha256 -verify wrong.pub -signature payload.sig payload.bin 2>&1)
wrong_rc=$?
printf '%s\n' "$wrong_out" | normalize
case "$wrong_out" in
  *invalid\ padding*"Verification failure"*) ok=0 ;;
  *) ok=1 ;;
esac
mark "$ok" "错误公钥被识别为 invalid padding"
echo

echo "[4/4] 证书链有效期检查（当前有效，+370 天过期）"
future_time=$(( $(date +%s) + 370 * 86400 ))
echo "\$ openssl verify -CAfile signer.crt signer.crt"
now_out=$(openssl verify -CAfile signer.crt signer.crt 2>&1)
now_rc=$?
printf '%s\n' "$now_out" | normalize
echo "\$ openssl verify -CAfile signer.crt -attime $future_time signer.crt"
future_out=$(openssl verify -CAfile signer.crt -attime "$future_time" signer.crt 2>&1)
future_rc=$?
printf '%s\n' "$future_out" | normalize
if [ "$now_rc" -eq 0 ] && [ "$future_rc" -ne 0 ] && printf '%s' "$future_out" | grep -q "certificate has expired"; then
  ok=0
else
  ok=1
fi
mark "$ok" "当前证书有效，+370 天证书链检查显示过期"
echo

echo "== SHA-256 =="
sha256sum payload.bin payload-tampered.bin
echo

echo "== 汇总 =="
echo "通过: $pass 失败: $fail"
if [ "$fail" -eq 0 ]; then
  echo "演示成功：dgst 只验证签名数学关系；有效期与证书链由 openssl verify 单独检查。"
  echo "原始验签返回码: $orig_rc，篡改返回码: $tampered_rc，错误公钥返回码: $wrong_rc，过期检查返回码: $future_rc"
  exit 0
fi
echo "演示未通过：请检查 OpenSSL 版本与环境。"
exit 1