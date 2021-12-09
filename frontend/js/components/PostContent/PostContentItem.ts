import * as Vue from 'vue'
import * as R from 'ramda'
import { unescape } from 'html-escaper'
import * as RA from 'ramda-adjunct'

import { redditDomains } from '../../../../downloads/media/domains'
import { PostContentSingleImage } from './PostContentSingleImage'
import { PostContentImageGallery } from './PostContentImageGallery'
import { PostContentVideo } from './PostContentVideo'
import { PostContentOfflineArticleLink } from './PostContentOfflineArticle'
import type { FrontendPost } from '../../frontend-global-types'

const getPostUrlProp = (post: FrontendPost): string => post.url
const crosspostParentPropNotNil = (post: FrontendPost): boolean => RA.isNotNil(post.crosspost_parent)
const hasSelfText = (post: FrontendPost): boolean => RA.isNonEmptyString(post.selftext)
const doesNotHaveSelfText = R.complement(hasSelfText)
const isTextPost = R.allPass([R.propEq('is_self', true), hasSelfText])

const postDomainIsOneOf =
  (domains: string[]) =>
  (post: FrontendPost): boolean =>
    domains.some((domain: string): boolean => post.domain === domain || post.domain.endsWith(`.${domain}`))

const isNotTextPost = R.complement(isTextPost)

const isSelfPost = R.allPass([
  R.anyPass([
    R.compose(R.startsWith('https://www.reddit.com/r/'), getPostUrlProp),
    R.compose(R.startsWith('https://old.reddit.com/r/'), getPostUrlProp),
  ]),
  R.propEq('is_self', true),
])

const isNotSelfPostWithoutText = R.complement(R.allPass([isSelfPost, doesNotHaveSelfText]))

const isRedditUrl = R.anyPass([
  postDomainIsOneOf(redditDomains),
  // A self post can sometimes have a domain of `self.aww`, so also check url.
  R.compose(R.startsWith('https://www.reddit.com/r/'), getPostUrlProp),
  R.compose(R.startsWith('https://old.reddit.com/r/'), getPostUrlProp),
  R.compose(R.startsWith('https://np.reddit.com/r/'), getPostUrlProp),
  R.compose(R.startsWith('/r/'), getPostUrlProp),
])

const isCrossPost = R.allPass([
  R.anyPass([isRedditUrl, crosspostParentPropNotNil]),
  // A self post with text will have its own url as the url, so check its not just a text post.
  isNotTextPost,
  // e.g. https://www.reddit.com/r/AskReddit/comments/ozxi8w/
  isNotSelfPostWithoutText,
])

/* eslint-disable security/detect-unsafe-regex */
const containsImageFile = R.any(R.test(/\.(png|jpe?g|gif|webp|svg|apng|avif|bmp|tiff?|avif|heif|heic)(\?.*)?$/u))

const containsVideoFile = R.any(R.test(/\.(gifv|mpe?g|mp4|m4v|m4p|ogv|ogg|mov|mkv|webm)(\?.*)?$/u))

const containsHTMLFile = R.any(R.test(/.*\.(htm$|html$)/u))

const containsWebpageScreenshot = R.any(R.test(/^screenshot\.(jpg|png)$/u))

const doesNotcontainHTMLFile = R.complement(containsHTMLFile)

const getDownloadedFilesProp = (post: FrontendPost): string[] => post.downloadedFiles

const isScrapedArticle = R.compose(
  R.anyPass([containsHTMLFile, containsWebpageScreenshot]),
  getDownloadedFilesProp
)

const downloadedFilesAreMediaFiles = R.anyPass([containsImageFile, containsVideoFile])

const isInlineMediaPost = R.compose(
  R.allPass([downloadedFilesAreMediaFiles, doesNotcontainHTMLFile, RA.isNonEmptyArray]),
  getDownloadedFilesProp
)

const PostContentItem = Vue.defineComponent({
  props: {
    post: Object as Vue.PropType<FrontendPost>,
  },
  components: {
    PostContentSingleImage,
    PostContentImageGallery,
    PostContentVideo,
    PostContentOfflineArticleLink,
  },
  methods: {
    hasSelfText(): boolean {
      return RA.isNotNil(this.post?.selftext_html) && RA.isNonEmptyString(this.post?.selftext_html)
    },
    postHasUrl(): boolean {
      return RA.isNotNil(this.post?.url)
    },
    isCrossPost(): boolean {
      return isCrossPost(this.post)
    },
    isScrapedArticle(): boolean {
      return isScrapedArticle(this.post as FrontendPost)
    },
    isInlineMediaPost(): boolean {
      return isInlineMediaPost(this.post as FrontendPost)
    },
    isSingleImage(): boolean {
      const downloadedFiles = this.post?.downloadedFiles as string[]
      return containsImageFile(downloadedFiles) && downloadedFiles.length === 1
    },
    isMultipleImages(): boolean {
      const downloadedFiles = this.post?.downloadedFiles as string[]
      return containsImageFile(downloadedFiles) && downloadedFiles.length > 1
    },
  },
  computed: {
    postHtml(): string {
      const postHtml = this.post?.selftext_html as string
      return unescape(postHtml)
    },
  },
  template: /* html */ `
    <div class="post-content" v-if="hasSelfText()" v-html="postHtml"></div>
    <div class="post-content" v-else-if="isCrossPost()">
      <a v-bind:href="post.url">{{post.url}}</a>
    </div>
    <div class="post-content" v-else-if="isScrapedArticle()">
      <post-content-offline-article-link v-bind:post="post"></post-content-offline-article-link>
    </div>
    <template v-else-if="isInlineMediaPost()">
      <div class="post-content" v-if="isSingleImage()">
        <post-content-single-image v-bind:post="post"></post-content-single-image>
      </div>
      <div class="post-content" v-else-if="isMultipleImages()">
        <post-content-image-gallery v-bind:post="post"></post-content-image-gallery>
      </div>
      <div class="post-content" v-else>
        <post-content-video v-bind:post="post"></post-content-video>
      </div>
    </template>
    <div class="post-content" v-else-if="postHasUrl()">
      <a v-bind:href="post.url">{{post.url}}</a>
    </div>
    <div class="post-content" v-else></div>
  `,
})

export { PostContentItem }
