/**
 * @file    通用 view
 * @author  lizhaoming
 */

define(function (require) {
    require('../utils/animation');
    var rt = require('ralltiir');
    var http = rt.http;
    var Naboo = require('../../fusion/deps/naboo');
    var Renderer = require('./render');
    var _ = rt._;
    var action = rt.action;
    var Promise = rt.promise;
    var animationTimeMs = 300;
    var animationDelayMs = 0;
    var animationEase = 'ease';
    var defaultHeadOptions = {
        back: {
            html: '<i class="c-icon">&#xe750;</i>',
            onClick: action.back.bind(action)
        }
    };

    function View() {
        this.renderer = new Renderer();
    };

    View.prototype.setTemplateStream = function (promise) {
        this.resourceQueryPromise = promise;
    };

    View.prototype.render = function () {
        this.prepareRender();
        var view = this;
        if (this.streamRenderPromise) {
            return this.streamRenderPromise;
        }
        var view = this;
        return this.streamRenderPromise = this.resourceQueryPromise
        .then(function (xhr) {
            return render(view.renderer, xhr.data || '', view.$body[0], '.rt-body')
        })
        .then(function () {
            view.rendered = true;
        });
    };

    View.prototype.partialUpdate = function (url, options) {
        var renderer = this.renderer;
        var body = this.$body[0];
        return View
        .createTemplateStream(url, {
            'x-rt-partial': 'true',
            'x-rt-selector': options.from || ':root'
        })
        .then(function (xhr) {
            rt.action.reset(url, null, {silent: true});
            var to = options.to ? body.querySelector(options.to) : body;
            to.dispatchEvent(new Event('rt.willUpdate'));
            if (options.replace) {
                to.innerHTML = '';
            }
            return render(renderer, xhr.data || '', to, options.from)
            .then(function () {
                to.dispatchEvent(new Event('rt.updated'));
            });
        })
        .catch(function (e) {
            console.warn('partialUpdate Error, redirecting', e);
            location.href = url;
        });
    };

    function render (renderer, html, to, from) {
        var wrapper = document.createElement('div');
        var fromEl = wrapper;
        wrapper.innerHTML = html;
        if (from) {
            var tmp = wrapper.querySelector(from);
            if (tmp) {
                fromEl = tmp;
            } else {
                console.warn('from element not found, using all');
            }
        }
        _.forEach(fromEl.querySelectorAll('[data-sfr-omit]'), function (el) {
            el.remove();
        });

        var html = fromEl.innerHTML;
        // 手百&浏览器 内核渲染数据标记
        html += '<rendermark></rendermark>';
        return renderer.render(to, html);
    }

    function updateTitleBarElement($el, options) {
        if (_.has(options, 'html')) {
            $el.html(options.html);
        }
        if (_.has(options, 'onClick')) {
            $el.off('click').on('click', function () {
                var cb = _.get(options, 'onClick') || _.noop;
                cb();
            });
        }
    }

    View.prototype.setHead = function (desc) {
        var $head = this.$head;

        updateTitleBarElement($head.find('.rt-back'), _.get(desc, 'back'));
        updateTitleBarElement($head.find('.rt-title'), _.get(desc, 'title'));
        updateTitleBarElement($head.find('.rt-subtitle'), _.get(desc, 'subtitle'));

        if (_.has(desc, 'actions')) {
            var $tool = $head.find('.rt-actions');
            $tool.empty();
            _.forEach(desc.actions, function (icon) {
                var $icon = $('<span>');
                updateTitleBarElement($icon, icon);
                $tool.append($icon);
            });
        }
    };

    View.prototype.parse = function ($el) {
        this.$view = $el;
        this.$head = $el.find('.rt-head');
        this.$body = $el.find('.rt-body');
        this.$view.addClass('active');
        this.$view.get(0).ralltiir = this;
        this.setHead(defaultHeadOptions);
        this.rendered = true;
    };

    View.prototype.renderFrame = function (opts) {
        if (this.frameRendered) {
            return false;
        }
        this.frameRendered = true;

        this.$head = $([
            '<div class="rt-head">',
                '<div class="rt-back"></div>',
                '<div class="rt-actions"></div>',
                '<div class="rt-center">',
                    '<span class="rt-title"></span>',
                    '<span class="rt-subtitle"></span>',
                '</div>',
            '</div>'
        ].join(''));
        this.setHead(_.defaultsDeep(opts.head, defaultHeadOptions));

        this.$body = $('<div class="rt-body">');
        this.$view = $('<div class="rt-view">');
        this.$view.append(this.$head).append(this.$body);
        this.$view.addClass('active');
        this.$view.get(0).ralltiir = this;

        $(rt.doc).append(this.$view);
    };

    // TODO 统一由 attach 操作，干掉 reAttach
    View.prototype.reAttach = function () {
        rt.doc.appendChild(this.$view.get(0));
    };

    View.prototype.startEnterAnimate = function () {
        var self = this;
        return new Promise(function (resolve) {
            if (self.enterAnimate) {
                var dom = self.$view[0];
                Naboo.enter(dom, animationTimeMs, animationEase, animationDelayMs).start(resolve);
            }
            else {
                self.$view.css({
                    'opacity': 1,
                    '-webkit-transform': 'none',
                    'transform': 'none'
                }).show();
                resolve();
            }
        });
    };

    View.prototype.prepareRender = function () {
        // 设为 static 的动作必须在动画结束后且原页面已销毁时进行操作
        // 否则会导致页面滚动位置的跳动
        this.$view.css({
            'position': 'static',
            '-webkit-transform': 'none',
            'transform': 'none',
            'min-height': $(window).height()
        });
    };

    View.prototype.attach = function () {
        this.$view.trigger('rt.attached');
        this.attached = true;
    };

    View.prototype.beforeDetach = function () {
        this.$body.trigger('rt.willDetach');
        this.$view.removeClass('active');
    };

    View.prototype.detach = function () {
        this.$view.trigger('rt.detached')
        this.$view.remove()
        this.attached = false;
    };

    View.prototype.startExitAnimate = function () {
        var self = this;
        return new Promise(function (resolve) {
            if (self.exitAnimate) {
                var dom = self.$view[0];
                Naboo
                .exit(dom, animationTimeMs, animationEase, animationDelayMs)
                .start(function () {
                    resolve();
                });
            }
            else {
                self.$view.css({
                    'display': 'none',
                    '-webkit-transform': 'none',
                    'transform': 'none'
                });
                resolve();
            }
        });
    };

    View.prototype.destroy = function () {
        this.$view
        .trigger('rt.destroyed')
        .remove();
        delete this.$view;
        delete this.$head;
        delete this.$body;
    };

    View.createTemplateStream = function (url, headers) {
        return http.ajax(url, {
            headers: _.assign(headers, {
                'x-rt': 'true'
            }),
            xhrFields: {
                withCredentials: true
            }
        });
    };

    return View;
});
