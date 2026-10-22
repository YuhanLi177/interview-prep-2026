# 向 data/ 追加「面经传闻」内容（confidence: community）。
# 原始核心数据由 tools/build.py 生成；本脚本负责社区/传闻类扩展内容，
# 技术事实仍以官方文档（RFC 9110/9111、MDN、docs.stripe.com）为准。
# 幂等：重复运行不会重复追加。
import json, os

ROOT = os.path.join(os.path.dirname(__file__), "..", "data")

IDEM = "https://docs.stripe.com/api/idempotent_requests"
PAGN = "https://docs.stripe.com/api/pagination"
ERRS = "https://docs.stripe.com/api/errors"
EHND = "https://docs.stripe.com/error-handling"
RATE = "https://docs.stripe.com/rate-limits"
WBHK = "https://docs.stripe.com/webhooks"
AUTH = "https://docs.stripe.com/api/authentication"
R9110 = "https://www.rfc-editor.org/rfc/rfc9110"
R9111 = "https://www.rfc-editor.org/rfc/rfc9111"
MID = "https://developer.mozilla.org/en-US/docs/Glossary/Idempotent"
M429 = "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/429"
M401 = "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/401"
M403 = "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/403"
MRA = "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Retry-After"
AWS = "https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/"
OKHTTP = "https://square.github.io/okhttp/"
RETRO = "https://square.github.io/retrofit/"
GHREST = "https://docs.github.com/en/rest/using-the-rest-api/using-pagination-in-the-rest-api"

KP_ID = "T3sx"

KP = {
    "track": "T3",
    "track_name": "Backend",
    "week": 1,
    "id": KP_ID,
    "title_zh": "Stripe 式 HTTP/API 集成",
    "confidence": "community",
    "rumor_note_zh": "Reddit/Blind/PracHub 等面经称 Stripe 面试包含 HTTP 请求 / API 集成任务（JSON → REST → 解析 → 链式调用）；“会考这个”是传闻，下面的技术内容本身全部来自官方文档。",
    "summary_zh": "Idempotency-Key 防重复扣款；cursor 分页（limit + starting_after + has_more）；429 限流用指数退避 + 抖动；webhook 用 Stripe-Signature 验签并检查时间戳防重放。",
    "sources": [{"url": u, "verified": True} for u in [IDEM, PAGN, ERRS, RATE, WBHK, R9110, R9111]],
}

def q(prompt, opts, why, *src):
    return dict(
        kp_id=KP_ID, type="mcq", confidence="community",
        prompt_zh=prompt, options=opts, answer=0, explanation_zh=why,
        sources=[{"url": u, "verified": True} for u in src],
    )

NEW_QS = [
    q("Stripe API 里防止同一笔 POST 收款被重复执行，用什么机制？",
      ["请求头加 Idempotency-Key，Stripe 保存首次请求的结果并对相同 key 重放",
       "把请求改成 GET", "在 body 里加时间戳字段", "连发多次取最后一次结果"],
      "Stripe 幂等机制：对每个 idempotency key 保存第一次请求的状态码和响应体，之后带相同 key 的请求直接返回同样的结果，不会重复执行。",
      IDEM, R9110),
    q("Stripe 的 idempotency key 官方建议怎么生成？多久失效？",
      ["用足够随机唯一的值（如 V4 UUID），key 至少 24 小时后会被自动清除",
       "用自增整数，永久有效", "用当前时间戳，1 分钟过期", "用用户邮箱"],
      "文档建议用 V4 UUID 这类熵足够的随机字符串（最长 255 字符）；key 存在至少 24 小时后会被系统自动清除，之后重用等于新请求。",
      IDEM),
    q("按 Stripe 文档，对哪类请求发送 idempotency key 才有意义？",
      ["POST；GET 和 DELETE 本身就是幂等的，带 key 没有效果",
       "所有方法都必须带", "只有 GET", "只有 DELETE"],
      "Stripe：POST 请求接受 idempotency key；GET/DELETE 按 HTTP 语义本来就幂等，发送 key 无效果。与 RFC 9110 §9.2.2 的幂等方法定义一致。",
      IDEM, R9110),
    q("Stripe list 接口的分页方式是？",
      ["cursor 式：limit + starting_after / ending_before，响应带 data 数组和 has_more",
       "page=1&size=20 的页码式", "offset / limit 偏移式", "靠 Link 响应头"],
      "Stripe 所有顶层 list API 用基于对象 id 的 cursor 分页：limit（1–100，默认 10）、starting_after、ending_before；响应是 {object:\"list\", data:[...], has_more}。",
      PAGN),
    q("拉取 Stripe 列表“下一页”的正确做法？",
      ["把上一页最后一个对象的 id 作为 starting_after 再请求，直到 has_more 为 false",
       "把 page 参数 +1", "把 limit 翻倍重发", "解析 Link: rel=\"next\" 响应头"],
      "cursor 分页：用最后一个对象 id 填 starting_after 取下一页；ending_before 用于取上一页；has_more=false 表示没有更多数据。",
      PAGN),
    q("请求被 Stripe 限流时返回什么？客户端应如何应对？",
      ["429 Too Many Requests；用指数退避（最好加抖动）重试",
       "500，应立即原样重试", "403，应更换 API key", "301，跟随跳转即可"],
      "Stripe 限流返回 429 too_many_requests；官方建议在代码里用 exponential backoff 重试，AWS Builders' Library 进一步建议加 jitter 把重试打散。",
      RATE, M429, AWS),
    q("Stripe 错误对象里，“卡被拒”这类业务失败怎么表示？",
      ["type=card_error（HTTP 402），配合 code（如 card_declined）和 decline_code",
       "HTTP 404 Not Found", "type=api_error 表示卡的问题", "只能靠 message 字符串匹配"],
      "Stripe 错误有 type（api_error / card_error / idempotency_error / invalid_request_error）；卡被拒属于 card_error，HTTP 状态码 402，应按 code/decline_code 编程处理而不是解析 message。",
      ERRS, EHND),
    q("401 和 403 的区别是？Stripe 里 401 通常意味着什么？",
      ["401 = 未认证/凭证无效（Stripe：API key 不对），403 = 已认证但无权限",
       "401 = 无权限，403 = 未登录", "两者完全等价", "401 只用于 token 过期"],
      "RFC 9110/MDN：401 Unauthorized 表示缺少或无效的认证凭证，403 Forbidden 表示服务器理解请求但拒绝授权；Stripe 文档：401 = No valid API key provided。",
      R9110, M401, M403, ERRS),
    q("验证 Stripe webhook 事件真伪的正确做法是？",
      ["用 endpoint 的签名密钥校验 Stripe-Signature 头（HMAC-SHA256），并检查时间戳防重放",
       "检查 User-Agent 是否为 Stripe", "只要走 HTTPS 就可信", "比较 body 里的 livemode 字段"],
      "Stripe 给每个事件加 Stripe-Signature 头，用 endpoint 的 signing secret 做 HMAC-SHA256 验签；签名里含时间戳，官方库默认容忍 5 分钟以内，防止重放攻击。",
      WBHK),
    q("webhook handler 收到事件后应该怎么响应？",
      ["尽快返回 2xx，把耗时业务放到队列/后台；非 2xx 或超时 Stripe 会按计划重试",
       "同步做完所有业务逻辑再返回", "返回 301 让 Stripe 换地址", "故意返回 500 让 Stripe 重发以防丢失"],
      "Stripe 要求 handler 在复杂逻辑之前先快速返回成功状态码，否则视为失败并重试投递；重试意味着 handler 还要对重复事件做幂等处理。",
      WBHK),
    q("服务器想告诉客户端“等多久再重试”（如 429/503），用哪个响应头？",
      ["Retry-After", "X-Wait", "Expires", "Age"],
      "RFC 9110 §10.2.3 定义 Retry-After，可用于 503 和 429 等场景，值是秒数或 HTTP 日期；MDN 的 429 页面也建议配合 Retry-After。",
      R9110, MRA, M429),
    q("用 OkHttp/Retrofit 写带退避的自动重试，哪类请求可以直接重试？",
      ["幂等请求（GET/PUT/DELETE 和 safe 方法）；POST 要先配 idempotency key 才能安全重试",
       "所有请求都能盲目重试", "只有 POST 可以重试", "返回 2xx 的请求"],
      "RFC 9110：幂等请求可在连接失败时自动重试，非幂等（POST）不行，除非能让语义变幂等——Stripe 的做法就是 Idempotency-Key；重试要配 backoff + jitter。",
      R9110, MID, AWS, IDEM),
    q("调用 Stripe API 时怎么认证？",
      ["Authorization: Bearer <secret key>（或 HTTP basic auth，key 作用户名）",
       "把 secret key 放在 URL query 里", "用 Cookie", "不需要认证"],
      "Stripe 用 API key 认证：HTTP bearer（Authorization: Bearer sk_...）或 basic auth（key 作用户名、密码留空）；secret key 只能放在服务端/受控环境，不要泄漏到客户端或仓库。",
      AUTH),
]

HANDS_ON = {
    "note_zh": "面经称 Stripe 等公司的 onsite 包含「JSON → REST → 解析 → 链式调用」的实操题（传闻）；下面的任务在本地 Kotlin 项目或 Android Studio 里都能做，技术参考全部是官方文档。写完代码贴进编辑器，用「提交批改」发给导师批改。",
    "confidence": "community",
    "items": [
        {
            "id": "ho1",
            "title_zh": "用 OkHttp/Retrofit 调一个公开 HTTP API 并解析 JSON",
            "kind": "code",
            "confidence": "community",
            "prompt_zh": "用 Kotlin + OkHttp（或 Retrofit + converter）调用公开 API（例如 GET https://api.github.com/repos/square/okhttp），解析 JSON 出 name、stargazers_count、description 并打印。要求：请求放在后台线程/协程；处理非 2xx（读 code() 和 body）；超时设置 connect/read 各 10s。",
            "sources": [
                {"url": OKHTTP, "verified": True},
                {"url": RETRO, "verified": True},
                {"url": "https://docs.github.com/en/rest/repos/repos", "verified": True},
            ],
        },
        {
            "id": "ho2",
            "title_zh": "带退避 + 抖动的重试，以及 POST 的 idempotency key",
            "kind": "code",
            "confidence": "community",
            "prompt_zh": "在 ho1 的基础上实现 retry 包装器：对幂等请求（GET）在 IOException / 429 / 5xx 时最多重试 3 次，间隔 = base × 2^attempt + 随机 jitter，并尊重 Retry-After 头；再写一个 POST 示例：生成 V4 UUID 作为 Idempotency-Key 头，模拟“响应超时后用同一个 key 重发”。说明为什么 POST 不带 key 时不能盲目重试。",
            "sources": [
                {"url": AWS, "verified": True},
                {"url": IDEM, "verified": True},
                {"url": R9110, "verified": True},
                {"url": MRA, "verified": True},
            ],
        },
        {
            "id": "ho3",
            "title_zh": "解析分页结果直到取完（cursor 与 page 两种风格）",
            "kind": "code",
            "confidence": "community",
            "prompt_zh": "写一个函数把分页 API 拉完并合并成一个 List：① GitHub 风格：GET https://api.github.com/repos/square/okhttp/contributors?per_page=30&page=N，循环到返回空数组（或解析 Link 头）；② 再按 Stripe 风格写伪代码/实现：limit + starting_after=上一页最后一个 id，循环直到 has_more=false。比较两种分页在“翻页时数据被插入/删除”情况下的表现。",
            "sources": [
                {"url": GHREST, "verified": True},
                {"url": PAGN, "verified": True},
                {"url": OKHTTP, "verified": True},
            ],
        },
    ],
}


def main():
    # knowledge_points.json
    kp_path = os.path.join(ROOT, "knowledge_points.json")
    kps = json.load(open(kp_path))
    if not any(k["id"] == KP_ID for k in kps):
        kps.append(KP)
        json.dump(kps, open(kp_path, "w"), ensure_ascii=False, indent=1)
        print(f"knowledge_points.json: +1 ({KP_ID})")

    # questions.json：接着现有 qNNN 编号追加
    q_path = os.path.join(ROOT, "questions.json")
    qs = json.load(open(q_path))
    if not any(x["kp_id"] == KP_ID for x in qs):
        start = max(int(x["id"][1:]) for x in qs) + 1
        for i, item in enumerate(NEW_QS):
            qs.append({"id": f"q{start + i:03d}", **item})
        json.dump(qs, open(q_path, "w"), ensure_ascii=False, indent=1)
        print(f"questions.json: +{len(NEW_QS)} (q{start:03d}..q{start + len(NEW_QS) - 1:03d})")

    # hands_on.json
    ho_path = os.path.join(ROOT, "hands_on.json")
    json.dump(HANDS_ON, open(ho_path, "w"), ensure_ascii=False, indent=1)
    print("hands_on.json: written")


if __name__ == "__main__":
    main()
