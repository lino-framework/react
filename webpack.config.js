const autoprefixer = require('autoprefixer');
const path = require('path');

module.exports = {
    entry: ["./lino_react/react/index.js"],
    output: {
      filename: 'main.js',
      path: path.resolve(__dirname, './lino_react/react/static/react'),
    },
    module: {
        rules: [
            // {
            //     test: /\.js$/,
            //     exclude: /node_modules/,
            //     use: {
            //         loader: "babel-loader"
            //     }
            // },
            {
                // "oneOf" will traverse all following loaders until one will
                // match the requirements. When no loader matches it will fall
                // back to the "file" loader at the end of the loader list.
                oneOf: [
                    // "url" loader works like "file" loader except that it embeds assets
                    // smaller than specified limit in bytes as data URLs to avoid requests.
                    // A missing `test` is equivalent to a match.
                    {
                        test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
                        loader: require.resolve('url-loader'),
                        options: {
                            limit: 10000,
                            name: '/static/media/[name].[hash:8].[ext]',
                            outputPath: '../../',
                        },
                    },
                    // Process JS with Babel.
                    {
                        test: /\.(js|jsx|mjs)$/,
                        // include: paths.appSrc,
                        loader: require.resolve('babel-loader'),
                        options: {

                            // This is a feature of `babel-loader` for webpack (not Babel itself).
                            // It enables caching results in ./node_modules/.cache/babel-loader/
                            // directory for faster rebuilds.
                            cacheDirectory: true,
                        },
                    },
                    // css-loader resolves paths in CSS and adds assets as dependencies.
                    // style-loader turns CSS into JS modules that inject <style> tags.
                    // postcss-loader applies autoprefixer to our CSS.
                    // In production, we use a plugin to extract that CSS to a file, but
                    // in development style-loader enables hot editing of CSS.
                    {
                        test: /\.css$/,
                        use: [
                            require.resolve('style-loader'),
                            {
                                loader: require.resolve('css-loader'),
                                options: {
                                    importLoaders: 1,
                                },
                            },
                            {
                                loader: require.resolve('postcss-loader'),
                                options: {
                                    // Necessary for external CSS imports to work
                                    // https://github.com/facebookincubator/create-react-app/issues/2677
                                    postcssOptions: {
                                    ident: 'postcss',
                                    plugins: () => [
                                        require('postcss-flexbugs-fixes'),
                                        autoprefixer({
                                            flexbox: 'no-2009',
                                        }),
                                    ],
                                    }
                                },
                            },
                        ],
                    },
                    // "file" loader makes sure those assets get served by WebpackDevServer.
                    // When you `import` an asset, you get its (virtual) filename.
                    // In production, they would get copied to the `build` folder.
                    // This loader doesn't use a "test" so it will catch all modules
                    // that fall through the other loaders.
                    {
                        // Exclude `js` files to keep "css" loader working as it injects
                        // its runtime that would otherwise processed through "file" loader.
                        // Also exclude `html` and `json` extensions so they get processed
                        // by webpacks internal loaders.
                        exclude: [/\.(js|jsx|mjs)$/, /\.html$/, /\.json$/],
                        loader: require.resolve('file-loader'),
                        options: {
                            name: '/static/media/[name].[hash:8].[ext]',
                            outputPath: '../../',
                        },
                    },
                ],
            },
            // {
            //     test: /\.css$/,
            //     loader: 'style-loader'
            // }, {
            //     test: /\.css$/,
            //     loader: 'css-loader',
            //     query: {
            //         modules: true,
            //         localIdentName: '[name]__[local]___[hash:base64:5]'
            //     }
            // }

        ]
    },
    /* Uncomment to enable profiling in devtools*/
    // resolve: {
    //     alias: {
    //         'react-dom$': 'react-dom/profiling',
    //         'scheduler/tracing': 'scheduler/tracing-profiling',
    //     }
    // }
};
