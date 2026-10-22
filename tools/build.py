import json
NC="https://github.com/neetcode-gh/leetcode"
def ncs(f): return f"https://github.com/neetcode-gh/leetcode/blob/main/python/{f}.py"
TIH_HT="https://www.techinterviewhandbook.org/algorithms/hash-table/"
TIH_AR="https://www.techinterviewhandbook.org/algorithms/array/"
TIH_ST="https://www.techinterviewhandbook.org/algorithms/stack/"
TIH_STR="https://www.techinterviewhandbook.org/algorithms/string/"
WHT="https://en.wikipedia.org/wiki/Hash_table"; WBS="https://en.wikipedia.org/wiki/Binary_search"
KT="https://kotlinlang.org/docs/collections-overview.html"
KTAD="https://kotlinlang.org/api/core/kotlin-stdlib/kotlin.collections/-array-deque/"
JPQ="https://docs.oracle.com/javase/8/docs/api/java/util/PriorityQueue.html"
P1="https://developer.android.com/guide/platform"; HAL="https://source.android.com/docs/core/architecture/hal"
P2="https://source.android.com/docs/core/runtime"; JIT="https://source.android.com/docs/core/runtime/jit-compiler"
P3="https://source.android.com/docs/core/runtime/zygote"; P4="https://source.android.com/docs/core/architecture"
P5="https://source.android.com/docs/core/architecture/hidl/binder-ipc"
HIDL="https://source.android.com/docs/core/architecture/hidl"
AHAL="https://source.android.com/docs/core/architecture/aidl/aidl-hals"
P7="https://developer.android.com/develop/background-work/services/aidl"
BND="https://developer.android.com/develop/background-work/services/bound-services"
P13="https://developer.android.com/topic/performance/memory-overview"
P16="https://developer.android.com/topic/performance/baselineprofiles/overview"
P17="https://source.android.com/docs/automotive/vhal"; VHI="https://source.android.com/docs/automotive/vhal/vhal-interface"
P18="https://source.android.com/docs/core/perf/boot-times"
R9110="https://www.rfc-editor.org/rfc/rfc9110"; R9111="https://www.rfc-editor.org/rfc/rfc9111"
MID="https://developer.mozilla.org/en-US/docs/Glossary/Idempotent"
AWS="https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/"
AWSB="https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/"
GI="https://grpc.io/docs/what-is-grpc/introduction/"; GC="https://grpc.io/docs/what-is-grpc/core-concepts/"; GA="https://grpc.io/docs/platforms/android/"
PB="https://protobuf.dev/overview/"; PB3="https://protobuf.dev/programming-guides/proto3/"
MC="https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching"
MCC="https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control"
M304="https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/304"
MINM="https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/If-None-Match"
WEB="https://web.dev/articles/http-cache"

Q=[]
def q(kp,prompt,opts,why,*src):
    Q.append(dict(kp_id=kp,type="mcq",prompt_zh=prompt,options=opts,answer=0,explanation_zh=why,sources=[{"url":u,"verified":True} for u in src]))
k="T1w1"
q(k,"Two Sum 的 O(n) 解法核心是？",["HashMap 存 value→index，查 target − x","先排序再二分","双重循环","用 PriorityQueue"],"扫一遍，每个元素先查补数 target − x 是否已在 HashMap 里，再把自己放进去；哈希表查找平均 O(1)，整体 O(n)。",ncs("0001-two-sum"),TIH_HT)
q(k,"Two Sum 扫到元素 x 时，应在 HashMap 里查什么？",["target − x","target + x","x × 2"],"NeetCode 解法：diff = target − n，查 diff 是否在 prevMap 里。",ncs("0001-two-sum"),TIH_HT)
q(k,"Two Sum 用 HashMap 解法的空间复杂度？",["O(n)","O(1)","O(n²)"],"最坏情况下 HashMap 要存下全部 n 个 value→index。",ncs("0001-two-sum"),WHT)
q(k,"Contains Duplicate 的线性时间做法用什么？",["HashSet","Stack","LinkedList","二分查找"],"遍历时检查元素是否已在集合里，在则返回 true，否则加入。",ncs("0217-contains-duplicate"),TIH_HT)
q(k,"用 HashSet 做 Contains Duplicate 的时间复杂度？",["O(n)","O(n²)","O(log n)"],"哈希表查找、插入平均 O(1)，做 n 次即 O(n)。",TIH_HT,WHT)
q(k,"Valid Anagram 的标准做法？",["比较两个字符串的字符计数","只比较长度","从两端双指针比较"],"两串长度相同且每个字符出现次数相同即为 anagram；排序后比较也行，但是 O(n log n)。",ncs("0242-valid-anagram"),TIH_STR)
q(k,"Group Anagrams 的 HashMap key 通常取什么？",["排序后的字符串（或 26 位字符计数）","字符串长度","首字母","字符串的 hashCode"],"互为 anagram 的字符串排序后相同、字符计数也相同；NeetCode 用计数 tuple 作 key。",ncs("0049-group-anagrams"),TIH_STR)
q(k,"Group Anagrams 在 NeetCode 里属于哪个 pattern？",["Arrays & Hashing","Sliding Window","Graphs"],"NeetCode 仓库 README 中 0049 Group Anagrams 列在 Arrays & Hashing 下。",NC,ncs("0049-group-anagrams"))
q(k,"Top K Frequent Elements 的第一步通常是？",["用 HashMap 统计频次","先二分查找","建 Trie"],"NeetCode 解法先 count，再按频次分桶从高往低取 K 个（也可用堆）。",ncs("0347-top-k-frequent-elements"),TIH_HT)
q(k,"Kotlin 里哪个集合可同时当 stack 和 queue 用？",["ArrayDeque","HashMap","Set","Array"],"Kotlin 官方集合文档：ArrayDeque 是双端队列，可同时充当 Stack 和 Queue。",KT,KTAD)
q(k,"在 Kotlin/JVM 上做 Top K，常用的堆是哪个类？",["java.util.PriorityQueue","kotlin.collections.ArrayDeque","HashMap"],"Kotlin 标准库没有自带堆；JVM 上用 java.util.PriorityQueue，官方文档说它基于 priority heap。",JPQ,ncs("0347-top-k-frequent-elements"))
k="T1w2"
q(k,"Longest Substring Without Repeating Characters 属于哪个 pattern？",["Sliding Window + Set/Map","Binary Search","DP","Heap"],"NeetCode 把 0003 归在 Sliding Window；Tech Interview Handbook 也把它列为 sliding window 例题。",NC,TIH_AR)
q(k,"Longest Substring Without Repeating Characters 的时间复杂度？",["O(n)","O(n²)","O(n log n)"],"左右指针都只向右走，各最多 n 步，所以是 O(n)。",ncs("0003-longest-substring-without-repeating-characters"),TIH_AR)
q(k,"滑动窗口里遇到重复字符，下一步做什么？",["左边界右移，直到窗口内无重复","清空整个窗口重新开始","右边界左移"],"NeetCode 解法：while s[r] in set，就移除 s[l] 并 l += 1。",ncs("0003-longest-substring-without-repeating-characters"),TIH_AR)
q(k,"Valid Palindrome 在 NeetCode 里归在哪个 pattern？",["Two Pointers","Sliding Window","BFS","Trie"],"NeetCode README 中 0125 Valid Palindrome 列在 Two Pointers 下；也可从两端相向比较。",NC,TIH_STR)
q(k,"Valid Palindrome 比较时如何处理标点和大小写？",["跳过非字母数字，忽略大小写","全部计入","只看首尾字符"],"NeetCode 解法只保留 isalpha/isdigit 字符并转小写后再比较。",ncs("0125-valid-palindrome"),"https://leetcode.com/problems/valid-palindrome/")
q(k,"3Sum 的常见做法是？",["排序后固定一个数，剩余用双指针","三重循环","Trie","Union-Find"],"NeetCode 把 3Sum 归在 Two Pointers：先 sort，对每个 a 用 l/r 双指针。",ncs("0015-3sum"),NC)
q(k,"3Sum 进入双指针前的预处理是？",["排序","建 HashMap 存下标","建堆"],"排序后才能根据和偏大/偏小移动左右指针，也便于跳过重复。",ncs("0015-3sum"),TIH_AR)
q(k,"3Sum（排序 + 双指针）的时间复杂度？",["O(n²)","O(n)","O(n³)"],"外层固定一个数 O(n)，内层双指针 O(n)；排序 O(n log n) 被 O(n²) 覆盖。",ncs("0015-3sum"),TIH_AR)
q(k,"Best Time to Buy and Sell Stock 一遍扫描时要维护什么？",["到目前为止的最低价","最高价的下标列表","所有差值的排序"],"NeetCode 解法维护 lowest，每天用 price − lowest 更新最大利润。",ncs("0121-best-time-to-buy-and-sell-stock"),NC)
q(k,"NeetCode 把 Best Time to Buy and Sell Stock 归为？",["Sliding Window","Binary Search","Graphs"],"NeetCode README 中 0121 列在 Sliding Window 下。",NC,ncs("0121-best-time-to-buy-and-sell-stock"))
k="T1w3"
q(k,"Valid Parentheses 用什么数据结构？结束条件？",["Stack；最后栈必须为空","Queue；队列满","HashSet；集合为空","Heap；堆顶为 ("],"左括号入栈，右括号与栈顶配对后出栈，最后 return not stack。Tech Interview Handbook 把它列为 stack 必练题。",ncs("0020-valid-parentheses"),TIH_ST)
q(k,"Valid Parentheses 遇到右括号时做什么？",["检查栈顶是否为对应左括号，是则弹出","压入栈","什么都不做"],"NeetCode 解法：栈空或栈顶不匹配就返回 false，否则 pop。",ncs("0020-valid-parentheses"),TIH_ST)
q(k,"Valid Parentheses 遍历结束后返回 true 的条件？",["栈为空","栈里只剩一个元素","栈满"],"剩下未配对的左括号说明无效。",ncs("0020-valid-parentheses"),TIH_ST)
q(k,"输入 \"(]\" 时 Valid Parentheses 的结果？",["false","true","抛异常"],"] 对应的是 [，与栈顶 ( 不配对，直接返回 false。",ncs("0020-valid-parentheses"),TIH_ST)
q(k,"Kotlin 里写 Valid Parentheses，栈用哪个类？",["ArrayDeque<Char>","HashMap<Char, Int>","PriorityQueue<Char>"],"Kotlin 官方文档：ArrayDeque 可充当 Stack；栈是 LIFO 结构。",KT,TIH_ST)
q(k,"二分查找的时间复杂度？",["O(log n)","O(n)","O(1)"],"每次排除一半，最坏 O(log n) 次比较。",WBS,ncs("0033-search-in-rotated-sorted-array"))
q(k,"Search in Rotated Sorted Array 属于哪个 pattern？",["Binary Search","Sliding Window","Graph","Greedy"],"NeetCode README 中 0033 列在 Binary Search 下。",NC,ncs("0033-search-in-rotated-sorted-array"))
q(k,"旋转有序数组中，二分时可以利用的性质？",["mid 两侧至少有一半是有序的","整体仍然有序","中点一定是最小值"],"NeetCode 解法先用 nums[l] <= nums[mid] 判断哪一半有序，再看 target 是否落在那一半。",ncs("0033-search-in-rotated-sorted-array"),WBS)
q(k,"Find Minimum in Rotated Sorted Array：nums[mid] > nums[right] 说明？",["最小值在 mid 右侧","最小值在 mid 左侧（含 mid）","mid 就是最小值"],"NeetCode 解法注释“right has the min”，令 start = mid + 1。",ncs("0153-find-minimum-in-rotated-sorted-array"),NC)
q(k,"NeetCode 把 Find Minimum in Rotated Sorted Array 归为？",["Binary Search","Stack","Two Pointers"],"NeetCode README 中 0153 列在 Binary Search 下。",NC,ncs("0153-find-minimum-in-rotated-sorted-array"))
k="T2w1"
q(k,"Android 平台架构从上到下哪个顺序对？",["app → framework → system services → ART → HAL → kernel","app → kernel → HAL → framework","framework → app → HAL → ART","app → HAL → framework → kernel"],"AOSP architecture 页按 app、framework、system services、ART、HAL、kernel 分层；developer 的 platform 页同样以 Linux kernel 为底、HAL 在其上。",P4,P1)
q(k,"AOSP 架构里 system services 的例子是？",["system_server、SurfaceFlinger","Room、Paging","Retrofit、OkHttp","Gradle、R8"],"AOSP architecture：system services 是 system_server、SurfaceFlinger、MediaService 这类模块化组件。",P4,P1)
q(k,"system_server 属于哪一层？",["system services","HAL","kernel"],"AOSP architecture 把 system_server 列为 system service。",P4,P1)
q(k,"SurfaceFlinger 在 AOSP 架构中属于？",["system services","app 层","kernel 驱动"],"AOSP architecture 把 SurfaceFlinger 列为 system service。",P4,P1)
q(k,"Android 软件栈最底层是？",["Linux kernel","HAL","ART"],"Platform architecture：Android 平台的基础是 Linux kernel，ART 依赖它做线程和底层内存管理。",P1,P4)
q(k,"HAL 的作用是？",["提供标准接口，把硬件能力暴露给上层 framework","编译 Kotlin 代码","管理 Activity 栈"],"Platform architecture：HAL 提供标准接口，把设备硬件能力暴露给 Java API framework；AOSP HAL 概览：HAL 让厂商实现底层设备相关功能而不影响上层。",P1,HAL)
q(k,"framework 代码运行在哪里？",["app 自己的进程里","只在 system_server 里","kernel 里"],"AOSP architecture 原文：Android framework code runs inside an app's process；developer platform 页：每个 app 跑在自己的进程和 ART 实例里。",P4,P1)
q(k,"Java API framework 通过什么访问底层硬件？",["和 system services 通信","直接读写驱动","通过 Gradle"],"AOSP architecture：framework API 暴露的功能通过与 system services 通信来访问底层硬件。",P4,P1)
q(k,"车载 Android 里，车辆信号（车速、空调等）通过哪一层接入？",["Vehicle HAL（VHAL）","WorkManager","Activity","FCM"],"VHAL 文档：VHAL 接口以“属性”为抽象，读、写、订阅车辆的具体功能。",P17,VHI)
q(k,"VHAL 接口的核心抽象是什么？",["property（属性）的读、写、订阅","Intent 广播","HTTP 请求"],"VHAL 文档：The VHAL interface is based on accessing (reading, writing, and subscribing) a property；IVehicle 接口有 getValues / setValues。",P17,VHI)
k="T2w2"
q(k,"新 app 进程是怎么创建的？",["从 Zygote fork 出来","init 直接 exec 一个新 JVM","Launcher fork","app 自己 fork"],"Memory overview：每个 app 进程都由 Zygote fork 而来；About the Zygote 页描述 system server 通过 Unix domain socket 向 Zygote/USAP 请求进程。",P13,P3)
q(k,"system_server 和 Zygote（或 USAP pool）之间用什么通信？",["Unix domain socket","Binder","HTTP"],"About the Zygote：The system server uses a Unix domain socket 连接 Zygote / USAP。",P3,P13)
q(k,"为什么 Zygote 预加载框架代码能省内存？",["fork 出的进程之间共享这些内存页","压缩了 APK","关闭了 GC","跳过了 JIT"],"Memory overview：Zygote 启动时加载通用框架代码和资源，fork 出的 app 进程共享这些 RAM 页。",P13,P3)
q(k,"Zygote 在 fork 之前预加载了什么？",["通用框架代码和资源（如 activity 主题）","用户数据","网络缓存"],"Memory overview 原文：loads common framework code and resources (such as activity themes)。",P13,P3)
q(k,"USAP pool 是什么？",["Zygote 预先生成、尚未特化的 app 进程池（需通过系统属性开启）","图片缓存池","线程池"],"About the Zygote：Zygote 可以立即生成 unspecialized app processes（USAP），这需要通过系统属性或 adb 命令开启；system server 取用一个 USAP 后再改 PID、cgroup 等完成特化。",P3,P3)
q(k,"ART 支持哪两种编译方式？",["AOT 和 JIT","只有解释执行","只有 JIT","LLVM 和 GCC"],"ART 文档：引入 AOT 编译；ART JIT 文档：ART 还包含带 profiling 的 JIT 编译器。",P2,JIT)
q(k,"除了编译，ART 还负责什么？",["垃圾回收（GC）","网络栈","显示合成"],"ART 文档有 Improved garbage collection 一节。",P2,P1)
q(k,"Baseline Profiles 的作用（官方数据）？",["从首次启动起代码执行速度提升约 30%","减小 APK 一半","取消 GC","替代 Zygote"],"Baseline Profiles 概览：improve code execution speed by about 30% from the first launch，因为避免了解释和 JIT。",P16,JIT)
q(k,"Baseline Profiles 为什么从首次启动就见效？",["随 app 发布的 profile 指导安装时 AOT 编译，不用等运行时 JIT","因为关闭了 GC","因为跳过了 Zygote"],"Baseline Profiles 概览：避免对包含的代码路径做解释和 JIT；ART 文档说明 AOT 编译能提升性能。",P16,P2)
q(k,"AOSP boot 时间优化文档里关于 Zygote 的一条建议？",["尽早启动 Zygote（start zygote early）","推迟 Zygote 启动","关闭 ART"],"Optimize boot times：Saved 0.25s by starting zygote early。",P18,P3)
k="T2w3"
q(k,"什么时候必须用 AIDL？",["其他应用的客户端要 IPC，且 service 需要处理多线程","任何跨 activity 通信","所有 bound service","只要用 Kotlin"],"AIDL 页原文：AIDL is necessary only if you let clients from different applications access your service for IPC and you want to handle multithreading。",P7,BND)
q(k,"不需要跨应用并发 IPC 时，官方建议？",["直接实现 Binder（需 IPC 但不需多线程则用 Messenger）","一定要写 AIDL","改用 BroadcastReceiver"],"AIDL 页：不需要跨应用并发 IPC 就实现 Binder；要 IPC 但不需处理多线程就用 Messenger。",P7,BND)
q(k,"Messenger 适合哪种情况？",["需要 IPC 但不想处理多线程","必须多线程并发处理","只在同一进程内传数据"],"Bound services 页：Messenger 把所有请求排到单个线程，所以 service 不必设计成线程安全。",BND,P7)
q(k,"AIDL 接口的调用默认在哪个线程执行？",["不保证在主线程，service 必须线程安全","总是在主线程","总是在新建线程"],"AIDL 页：Incoming calls are not guaranteed to execute on the main thread，要从一开始就考虑多线程。",P7,BND)
q(k,"Android 8 起，framework/app 进程之间的 Binder 设备节点是？",["/dev/binder","/dev/vndbinder","/dev/hwbinder0"],"Binder IPC 文档：Android 8 起 /dev/binder 专属于 framework 进程；表格列出 /dev/binder 用于 framework/app 进程间的 AIDL IPC。",P5,BND)
q(k,"Android 8 引入的 vendor 进程之间（AIDL 接口）的 Binder 域用哪个节点？",["/dev/vndbinder","/dev/binder","/proc/binder"],"Binder IPC 文档：Android 8 为 vendor 服务新增 /dev/vndbinder（vendor/vendor，AIDL）；/dev/hwbinder 则用于 HIDL。注意 Android 10 的 stable AIDL 允许所有进程使用 /dev/binder。",P5,AHAL)
q(k,"Android 8 的 Binder scatter-gather 优化做了什么？",["把一次 binder 调用的数据拷贝从 3 次降到 1 次","支持 HTTP/2 多路复用","零拷贝 DMA 到 GPU"],"Binder IPC 文档：Android 8 uses scatter-gather optimization to reduce the number of copies from 3 to 1。",P5,P5)
q(k,"Android 10 起 HIDL 的状态，以及新 HAL 用什么定义接口？",["HIDL 已弃用，改用 (stable) AIDL","HIDL 是唯一推荐方式","用 JNI 定义"],"HIDL 页：As of Android 10, HIDL is deprecated and has been replaced by AIDL；AIDL for HALs 页：Android 11 起可用 AIDL 实现 HAL。",HIDL,AHAL)
q(k,"system 分区与 vendor 分区的组件之间通信，AIDL 必须满足什么？",["必须是 stable AIDL","必须用 Messenger","不能用 AIDL"],"AIDL for HALs：framework（system.img）与 hardware（vendor.img）之间的接口 must use stable AIDL。",AHAL,P5)
q(k,"车载 VHAL 从哪个版本迁移到 AIDL 接口？",["Android 13","Android 8","Android 4.4"],"VHAL 文档：In Android 13 and higher, VHAL migrated to AIDL at IVehicle.aidl；这正是 HIDL 弃用后 HAL 转向 AIDL 的实例。",P17,HIDL)
k="T3w1"
q(k,"以下哪组 HTTP 方法是 idempotent？",["PUT、DELETE 以及 safe 方法","只有 POST","POST 和 PATCH","只有 GET"],"RFC 9110 §9.2.2：PUT, DELETE, and safe request methods are idempotent；MDN 同样这么写。",R9110,MID)
q(k,"POST 是 idempotent 吗？",["不保证是","是","只在 HTTPS 下是"],"RFC 9110 的 idempotent 列表不含 POST；MDN：POST 和 PATCH 不保证 idempotent。",R9110,MID)
q(k,"PATCH 是否保证 idempotent？",["不保证","保证","只有 JSON Patch 才保证"],"MDN Idempotent：The POST and PATCH methods are not guaranteed to be idempotent；RFC 9110 列出的 idempotent 方法也不含 PATCH。",MID,R9110)
q(k,"GET 是 safe 方法，它是否也是 idempotent？",["是，safe 方法都是 idempotent","不是","取决于服务器"],"RFC 9110：safe 方法是 GET、HEAD、OPTIONS、TRACE，且 safe 方法都 idempotent；MDN：All safe methods are idempotent。",R9110,MID)
q(k,"同一个 DELETE 发两次，按 HTTP 语义预期效果是？",["对服务器的预期效果和发一次相同","删除两份资源","第二次一定报 500"],"idempotent 定义：多次相同请求对服务器的预期效果与一次相同（响应可以不同）。",R9110,MID)
q(k,"连接失败时，客户端能否自动重试 idempotent 请求？",["可以","不可以","只能重试 POST"],"RFC 9110：idempotent 请求可以在底层连接失败时自动重试；MDN：客户端可以安全重试 idempotent 方法的请求。",R9110,MID)
q(k,"POST 支付请求超时、不确定服务器有没有执行，客户端应该？",["不要盲目自动重试，除非有办法让请求变成 idempotent（如 idempotency key）","直接无限重试","改用 GET"],"RFC 9110：客户端 SHOULD NOT 自动重试非 idempotent 请求，除非能确认语义 idempotent 或确认原请求未被执行；idempotency key 就是让服务端识别重复请求的手段。",R9110,MID)
q(k,"大量客户端同时重试时，AWS 建议在 backoff 上加什么？",["jitter（随机抖动）","固定 1 秒间隔","立刻并发重试","关闭超时"],"AWS Builders' Library：Jitter adds some amount of randomness to the backoff to spread the retries around in time。",AWS,AWSB)
q(k,"重试时加 jitter 的目的？",["把重试时间打散，避免同时冲击服务","加密请求","减少 payload"],"AWS：如果所有客户端同时重试，重试本身会造成过载；jitter 用随机量分散到达率。",AWS,AWSB)
k="T3w2"
q(k,"gRPC 默认用什么序列化 / IDL？",["Protocol Buffers","XML","YAML","CSV"],"gRPC core concepts：By default, gRPC uses protocol buffers as the IDL 和消息格式。",GC,GI)
q(k,"gRPC 是否只能用 Protocol Buffers？",["不是，默认 protobuf，也可以换其他格式","是，强制 protobuf","只能用 JSON"],"gRPC core concepts：It is possible to use other alternatives if desired；intro 页：gRPC can use protocol buffers。",GC,GI)
q(k,"gRPC 的调用模型？",["客户端像调用本地对象一样调用远端服务方法","只能发 GET 请求","基于邮件"],"gRPC intro：client 可以 directly call a method on a server ... as if it were a local object。",GI,GC)
q(k,"gRPC 的 service 和 rpc 方法用什么描述？",["Protocol Buffers 的 .proto IDL","OpenAPI YAML","GraphQL schema"],"gRPC core concepts 示例用 .proto 里的 service / rpc 定义。",GC,PB3)
q(k,"Android 上哪些语言支持 gRPC 客户端？",["Java 和 Kotlin","只有 C++","都不支持"],"gRPC Android 平台页：The following languages support client-side gRPC on Android: Java, Kotlin；intro 页也列出 Android 平台。",GA,GI)
q(k,"Protobuf 官方对自己的描述？",["像 JSON，但更小更快","比 XML 更易读","只能用于 Go","一种数据库"],"protobuf.dev：It’s like JSON, except it’s smaller and faster, and it generates native language bindings。",PB,GI)
q(k,"Protobuf 是否和语言绑定？",["语言中立、平台中立","只能用于 Java","只能用于 C++"],"Protobuf overview：language-neutral, platform-neutral extensible mechanism。",PB,PB3)
q(k,"Protobuf 消息结构定义在哪里？",[".proto 文件","XML 布局","AndroidManifest"],"Protobuf overview：定义语言写在 .proto 文件里；proto3 guide 给出 message SearchRequest 示例。",PB,PB3)
q(k,"写好 .proto 后如何在代码里使用？",["用 protobuf 编译器生成各语言的数据访问代码","手写解析器","用反射读 JSON"],"Protobuf overview：proto compiler 生成与数据交互的代码；proto3 guide 讲如何从 .proto 生成 data access classes。",PB,PB3)
k="T3w3"
q(k,"定义 HTTP caching 的 RFC 是？",["RFC 9111","RFC 9110 §9","RFC 793"],"RFC 9111 标题即 HTTP Caching；MDN 缓存指南以它为规范来源。",R9111,MC)
q(k,"Cache-Control: no-cache 的含义？",["可以存，但每次使用前必须向服务器验证","完全不能存","永久缓存","只缓存在内存"],"RFC 9111 §5.2.2.4：no-cache 响应 MUST NOT 未经验证就用于后续请求；MDN Cache-Control 同义。",R9111,MCC)
q(k,"要求任何缓存都不存储响应，用哪个指令？",["no-store","no-cache","max-age=0","public"],"RFC 9111 §5.2.2.5：no-store 表示 cache MUST NOT store any part；MDN Cache-Control 同义。",R9111,MCC)
q(k,"no-store 对哪些缓存生效？",["私有缓存和共享缓存都生效","只对浏览器","只对 CDN"],"RFC 9111：This directive applies to both private and shared caches。",R9111,MCC)
q(k,"max-age=60 的含义？",["响应在 60 秒内是 fresh，超过即 stale","60 秒后删除服务器数据","最多请求 60 次"],"RFC 9111 §5.2.2.1：age 超过指定秒数即为 stale；web.dev：缓存版本一直使用到不再 fresh，由 max-age 决定。",R9111,WEB)
q(k,"缓存过期后，用 ETag 做条件请求时带哪个头？",["If-None-Match","If-Match-All","Cache-Key"],"MDN If-None-Match：只有 ETag 不匹配时服务器才返回 200 和资源；web.dev 也说明浏览器用 If-None-Match 做验证。",MINM,WEB)
q(k,"revalidate 时资源未变化，服务器返回？",["304 Not Modified","200 并带完整 body","404"],"RFC 9110 §15.4.5：304 表示条件 GET/HEAD 的条件为 false，无需再传内容；web.dev：ETag 匹配时返回 304。",R9110,WEB)
q(k,"含用户个人数据的响应应该用哪个指令避免被共享缓存存？",["private","public","immutable"],"MDN 缓存指南：个性化内容如果存在非私有缓存里可能泄露给其他用户，应使用 private。",MC,MCC)
q(k,"shared cache 的例子是？",["代理或 CDN","app 进程内存","SharedPreferences"],"RFC 9111：shared cache 为多个用户复用响应，通常部署在中间层；MDN：例如 Proxy、CDN。",R9111,MCC)
for i,x in enumerate(Q): x["id"]=f"q{i+1:03d}"
Q=[{"id":x["id"],**{k:v for k,v in x.items() if k!="id"}} for x in Q]
plan=json.load(open('/tmp/plan.json'))
SRC=plan["SRC"]; SRC.update({"S5":KT})
KPS=[("T1w1","T1",1,"Arrays & Hashing","用 HashMap/HashSet 把查找降到平均 O(1)：Two Sum、Contains Duplicate、Anagram、Top K。",[NC,TIH_HT,KT]),
("T2w1","T2",1,"平台架构","app → framework → system services → ART → HAL → kernel；车机通过 VHAL 的 property 接入车辆信号。",[P4,P1,HAL,P17]),
("T3w1","T3",1,"HTTP 语义与 idempotency","PUT/DELETE/safe 方法 idempotent，POST/PATCH 不保证；重试要 backoff + jitter，POST 靠 idempotency key。",[R9110,MID,AWS]),
("T1w2","T1",2,"Two Pointers / Sliding Window","双指针相向或同向移动，窗口右扩、冲突时左缩，通常 O(n)。",[NC,TIH_AR]),
("T2w2","T2",2,"Zygote 与 ART","system_server 通过 Unix socket 请求 Zygote fork；预加载框架代码共享内存页；ART 的 AOT/JIT、GC 和 Baseline Profiles。",[P3,P13,P2,JIT,P16]),
("T3w2","T3",2,"REST vs gRPC / Protobuf","gRPC 默认以 protobuf 作 IDL 和消息格式，像本地调用一样调远端方法；protobuf 语言中立、更小更快。",[GI,GC,PB]),
("T1w3","T1",3,"Stack / Binary Search","括号匹配用栈（LIFO）；二分每次排除一半，旋转数组先判断哪一半有序。",[NC,TIH_ST,WBS]),
("T2w3","T2",3,"Binder / AIDL","跨应用并发 IPC 才必须用 AIDL，否则 Binder 或 Messenger；binder/hwbinder/vndbinder 三个域；HIDL 弃用，HAL 改用 stable AIDL。",[P7,BND,P5,HIDL,AHAL]),
("T3w3","T3",3,"HTTP caching","no-cache vs no-store、max-age 新鲜度、ETag + If-None-Match → 304、private vs shared cache。",[R9111,MC,MCC,WEB])]
TR={"T1":"Coding","T2":"Android / Platform","T3":"Backend"}
kp=[dict(track=t,track_name=TR[t],week=w,id=i,title_zh=n,summary_zh=s,sources=[{"url":u,"verified":True} for u in src]) for i,t,w,n,s,src in KPS]
D="/workspace/interview-site-data/"
def dump(n,o): json.dump(o,open(D+n,"w"),ensure_ascii=False,indent=1)
dump("knowledge_points.json",kp); dump("questions.json",Q)
VER={"S3","S1","S5","P20","S6","S15","S11","P3","P13","P7","P6","P21","P9","P11","P16","S10","S13","S26","S17","S18","S19"}
CHECKED={"S3","S5","P20","S15","S11","P3","P13","P7","P21","P11","P16","S10","S26","S17","S18","S19","P6"}
diag=[dict(n=d["n"],track=d["track"],prompt_zh=d["q"],answer_zh=d["a"],scoring="0 / 0.5 / 1 自评",sources=[{"url":SRC[s],"verified":s in CHECKED} for s in d["src"]]) for d in plan["DIAG"]]
diag[8]["sources"]=[{"url":P7,"verified":True},{"url":BND,"verified":True}]
diag[9]["sources"].append({"url":"https://developer.android.com/topic/libraries/architecture/viewmodel/viewmodel-savedstate","verified":True})
dump("diagnostic.json",{"count":15,"minutes":45,"routing":[{"max_score":6,"route_zh":"12 周慢速版：Trees、Graphs、Zygote/Binder、Performance 各多给一周，每周 5–6 h"},{"max_score":11,"route_zh":"10 周默认版：只做必做题，每周 6–7 h"},{"max_score":15,"route_zh":"10 周 + stretch：补 Blind 75 剩下的题，或第 8 周开始 mock，每周 7–8 h"}],"questions":diag})
lc=lambda s:f"https://leetcode.com/problems/{s}/"
weeks=[]
for i in range(10):
    t1,t2,t3=plan["T1"][i],plan["T2"][i],plan["T3"][i]
    weeks.append(dict(week=i+1,
      T1=dict(pattern=t1["pattern"],gm_link_zh=t1["gm"],problems=[dict(name=p["name"],url=lc(p["slug"])) for p in t1["probs"]]),
      T2=dict(topic_zh=t2["topic"],detail_zh=t2["detail"],gm_link_zh=t2["gm"],docs=[SRC[s] for s in t2["src"]]),
      T3=dict(topic_zh=t3["topic"],docs=[SRC[s] for s in t3["src"]])))
rules=dict(start_date="2026-10-22",timezone="America/Toronto",daily_minutes=60,
 day_zero_zh="第 0 天（10/22）若诊断未完成，当天任务就是诊断测验",
 by_weekday_zh={"周一/周三/周五":"T1 Coding：本周题目切成 2 份（第 1–4 周）或 3 份（第 5 周起），每天做一份 + 最后 15 分钟复习一道旧题；无题目的周做 2 道随机 Medium",
  "周五（第 1–4 周）":"Stripe 替换日：跑 Stripe 官方练习仓库，用 debugger 修 bug，写 JSON → REST → 解析 → UI，复习 idempotency",
  "周二":"T2：读资料，画一张图","周四":"T2：写 1 页笔记（一张图 + 三条车机经验）","周六":"T3：读资料相关小节 + 做 5 张复习卡","周日":"复习：每日小测 5 题，重做一道没做顺的题，三个 track 自评 0–3"},
 stripe_friday_links=[SRC["STRIPE_PREP"],R9110,AWS],
 practice_zh=dict(unlock="知识点在其所属周开始后解锁（第 1 周开放第 1 周知识点）",on_wrong="答错后立刻出同一知识点的另一道题（避开最近出过的）",mastery_streak=3,review_gaps_days=[1,3,7],after_last_gap="每 7 天复习一次",min_questions_per_kp=8))
dump("daily_rotation.json",dict(rules=rules,weeks=weeks))
dump("roadmap.json",dict(weeks=10,tracks=[{"id":"T1","name":"Coding（Kotlin）"},{"id":"T2","name":"Android Platform / Mobile Design"},{"id":"T3","name":"Backend-for-mobile"}],
 plan=[dict(week=w["week"],T1=w["T1"]["pattern"],T2=w["T2"]["topic_zh"],T3=w["T3"]["topic_zh"]) for w in weeks],quiz_coverage_weeks=[1,2,3]))
dump("mocks.json",dict(companies=plan["MOCKS"],rubric=plan["RUBRIC"],verification_note_zh="面试流程和题型来自面经（Reddit / Blind / PracHub 等），不是官方资料；Mobile Design 题标注为未验证练习题。",official_links=[SRC["STRIPE_PREP"]]))
from collections import Counter
print(len(Q),Counter(x["kp_id"] for x in Q), sum(len(x["sources"])<2 for x in Q))
