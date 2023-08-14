# You Need A Parser

:information_source: This repository is a fork of the [original project by leolabs](https://github.com/leolabs/you-need-a-parser). It is fully integrated into the [Envelope Zero transaction import](https://l.envelope-zero.org/import-transactions).

[Suggest a Format](https://github.com/envelope-zero/you-need-a-parser/issues/new?template=format_request.md)

This repository consists of three packages:

### [ynap-parsers](packages/ynap-parsers)

This package contains all parsers for different formats. If you want to implement a
new parser, this is the way to go. This package is also available on NPM if you want
to use it in your own projects.

### [ynap-web-app](packages/ynap-web-app)

This is currently not in use.

### [ynap-bank2ynab-converter](packages/ynap-bank2ynab-converter/)

This tool fetches the current configuration file from [bank2ynab](https://github.com/bank2ynab/bank2ynab)
and converts it to a JSON file that can be read by ynap-parsers. This allows
ynap-parsers to support most of the banks supported by bank2ynab.

## Contributing

If you want to improve YNAP, feel free to submit an issue or open a pull request.

## License

This repo and all included packages are licensed under the
[MIT License](https://choosealicense.com/licenses/mit/).

If you use any of the packages in this repo in your project, a mention or link
to this repo would be nice but is not required.
