const SPACES = 4;
let modifiers;

const value = (element) => {
  let result;
  if (element.value === null || element.value === undefined) {
    result = element.default;
  } else {
    result = element.value;
  }
  return result;
}

const replace = (element, ...pairs) => pairs.reduce((prev, curr) => prev.replace(...curr), value(element));

const format = (el, element, isPermissions) => {
  let result;
  if (isPermissions) {
    switch (element.type) {
      case "string":
        result = `"${el}"`;
        break;
      default:
        result = `${el}`;
        break;
    }
  } else {
    switch (element.type) {
      case "string":
        result = `${el} = "${value(element)}"`;
        break;
      case "myLegalName":
        result = `${el} = "${modifiers.name}"`;
        break;
      case "sshdPort":
        result = `${el} = ${modifiers.sshdPort}`;
        break;
      case "p2pPort":
        result = `${el} = "localhost:${modifiers.p2pPort}"`;
        break;
      case "url.rpc":
        result = `${el} = "localhost:${modifiers.rpcPort}"`;
        break;
      case "url.admin":
        result = `${el} = "localhost:${modifiers.adminPort}"`;
        break;
      case "postgresUrl":
        {
          const val = replace(element, ["{{port}}", modifiers.postgres.port], ["{{schema}}", modifiers.postgres.schema]);
          result = `${el} = "${val}"`;
        }
        break;
      case "url":
        result = `${el} = "127.0.0.1:${modifiers.getPort()}"`
        break;
      default:
        result = `${el} = ${value(element)}`;
        break;
    }
  }
  return result;
}

const writeArray = ctx => {
  const {padding, el, current, depth} = ctx;
  modifiers.write(`${padding}${el} = [{`);
  generate(current.items, depth + 1, true);
  modifiers.write(`${padding}}]`);
}

const writeObject = ctx => {
  const {padding, el, current, depth} = ctx;
  modifiers.write(`${padding}${el} {`);
  generate(current, depth + 1);
  modifiers.write(`${padding}}`);
}

const writePermissionsArray = ctx => {
  const {padding, el, current, depth} = ctx;
  if (current.type === "permissionsArray") {
    // SPECIAL CASE
    modifiers.write(`${padding}${el} = [`);
    generate(current.items, depth + 1, false, true);
    modifiers.write(`${padding}]`);
  } else {
    modifiers.write(`${padding}${el}=${current.default}`);
  }
}

const writeDefault = ctx => {
  modifiers.write(`${ctx.padding}${format(ctx.el, ctx.current, ctx.isPermissions)}`);
}

const generate = (root, depth = 0, isArray = false, isPermissions = false) => {
  const padding = " ".repeat(depth * SPACES);
  const globalContext = { padding, depth, isPermissions };
  root.required.forEach((el) => {
    const context = Object.assign({}, globalContext, {el, current: root.properties[el]});
    if (isArray) {
      writePermissionsArray(context);
    } else if (context.current.type === "object"){
      writeObject(context);
    } else if (context.current.type === "array") {
      writeArray(context);
    } else {
      writeDefault(context);
    }
  })
}

const generateConfig = (root, _modifiers) => {
  modifiers = _modifiers;
  generate(root);
}

module.exports = generateConfig;
